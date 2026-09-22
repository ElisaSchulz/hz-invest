#!/usr/bin/env python3
"""
Gera as imagens do relatório modelo usadas na landing page do diagnóstico.

    python3 tools/gerar-imagens-lp.py

O que ele faz, em ordem:
  1. roda tools/gerar-relatorio-pdf.js para montar o relatório modelo em PDF
     (a partir de tools/diagnostico-exemplo.json), já com o visual atual;
  2. rasteriza cada página do PDF em alta resolução;
  3. escolhe as páginas pelo TÍTULO (não pelo número), grava cada uma como
     .webp em img/lp/, e monta o cartão de compartilhamento 1200x630.

Escolher pela página pelo título importa: se o relatório ganhar ou perder
uma seção, a numeração muda e o script continua pegando a página certa.

Requisitos (só para rodar o script; o site não depende deles):
    pip install pypdfium2 pillow
    node + playwright, os mesmos de tools/gerar-relatorio-pdf.js

Use --pdf caminho.pdf para pular a geração e rasterizar um PDF já pronto.
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAIDA = os.path.join(RAIZ, "img", "lp")

# Largura final de cada página. O cartão da galeria tem ~300px de largura,
# então 600px cobre telas retina sem desperdiçar peso.
LARGURA = 600

# arquivo  →  trecho do título da página no relatório
PAGINAS = {
    "modelo-capa":          "relatório personalizado",
    "modelo-score":         "score geral e nível de maturidade",
    "modelo-arquetipo":     "seu arquétipo financeiro",
    "modelo-kpis":          "kpis financeiros",
    "modelo-despesas":      "distribuição de despesas",
    "modelo-dimensoes":     "score por dimensão",
    "modelo-aposentadoria": "sua aposentadoria aos",
    "modelo-evolucao":      "como o patrimônio evolui",
    "modelo-plano":         "plano de ação individualizado",
    "modelo-checklist":     "checklist dos próximos 30 dias",
}

# As três páginas do cartão de compartilhamento, da de trás para a da frente.
CARTAO = ["modelo-aposentadoria", "modelo-capa", "modelo-kpis"]
CREME = (246, 244, 238)


def normaliza(texto):
    texto = unicodedata.normalize("NFD", texto or "")
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", texto).strip().lower()


# Só o começo do texto da página conta para achar o título. A página de
# boas-vindas lista o que vem no relatório ("...seu score geral e nível de
# maturidade... um plano de ação individualizado..."), e procurar no texto
# inteiro fazia duas seções casarem com ela em vez da página certa.
CABECALHO = 160


def casa(alvo, texto):
    """O título está no topo da página?

    As tarjas do relatório têm letter-spacing, e o PDF devolve essas linhas
    letra por letra ("R E L AT Ó R I O"). Por isso a segunda tentativa
    compara os dois lados sem espaço nenhum.
    """
    topo = texto[:CABECALHO]
    if alvo in topo:
        return True
    sem = lambda t: t.replace(" ", "")
    return sem(alvo) in sem(topo)


def numero_da_secao(texto):
    """O "03 · 13" impresso no alto da página, que é como o relatório se
    numera. Páginas de continuação não trazem esse selo e devolvem None."""
    m = re.search(r"\b(\d{2}) . (\d{2})\b", texto[:CABECALHO])
    return (int(m.group(1)), int(m.group(2))) if m else None


def gerar_pdf(destino):
    tool = os.path.join(RAIZ, "tools", "gerar-relatorio-pdf.js")
    dados = os.path.join(RAIZ, "tools", "diagnostico-exemplo.json")
    env = dict(os.environ)
    # O playwright costuma estar instalado global; o require() do tool procura
    # em node_modules, então damos o caminho sem exigir instalação no repo.
    if "NODE_PATH" not in env:
        for cand in ("/opt/node22/lib/node_modules", "/usr/lib/node_modules"):
            if os.path.isdir(os.path.join(cand, "playwright")):
                env["NODE_PATH"] = cand
                break
    print("· gerando o PDF do relatório modelo…")
    subprocess.run(["node", tool, dados, destino], check=True, env=env)


def paginas_do_pdf(caminho):
    """Devolve [(texto_normalizado, página)] para casar pelo título."""
    import pypdfium2 as pdfium

    pdf = pdfium.PdfDocument(caminho)
    saida = []
    for i in range(len(pdf)):
        pagina = pdf[i]
        texto = pagina.get_textpage().get_text_range()
        saida.append((normaliza(texto), pagina))
    return pdf, saida


def sombra(base, desfoque=18, opacidade=70, deslocamento=(0, 10)):
    """Sombra suave por baixo de uma página, para ela parecer papel."""
    from PIL import Image, ImageFilter

    margem = desfoque * 3
    tela = Image.new("RGBA", (base.width + margem * 2, base.height + margem * 2), (0, 0, 0, 0))
    recorte = Image.new("RGBA", base.size, (21, 21, 63, opacidade))
    if base.mode == "RGBA":
        recorte.putalpha(base.split()[3].point(lambda v: v * opacidade // 255))
    tela.paste(recorte, (margem + deslocamento[0], margem + deslocamento[1]), recorte)
    return tela.filter(ImageFilter.GaussianBlur(desfoque)), margem


def monta_cartao(imagens, destino):
    """Cartão 1200x630 com três páginas em leque, para o link no WhatsApp.

    As páginas entram inteiras e sobrepostas, com folga nas bordas: o corte
    que o WhatsApp faz no cartão varia, e página cortada pela metade é
    exatamente o que este mockup existe para não ter.
    """
    from PIL import Image

    L, A = 1200, 630
    tela = Image.new("RGB", (L, A), CREME)

    altura_pagina = int(A * 0.74)          # sobra margem em cima e embaixo
    sobreposicao = 0.30                    # quanto uma página cobre da outra
    # de trás para a frente: ângulo e escala relativa
    arranjo = [(-8, 0.90), (8, 0.90), (0, 1.0)]
    ordem_x = [0, 2, 1]                    # a página da frente fica no meio

    paginas = []
    for nome, (angulo, escala) in zip(CARTAO, arranjo):
        img = imagens[nome].convert("RGBA")
        alvo_a = int(altura_pagina * escala)
        alvo_l = int(img.width * alvo_a / img.height)
        paginas.append((img.resize((alvo_l, alvo_a), Image.LANCZOS), angulo))

    largura_base = paginas[-1][0].width
    passo = int(largura_base * (1 - sobreposicao))
    total = largura_base + passo * 2
    x0 = (L - total) // 2

    for (pagina, angulo), coluna in zip(paginas, ordem_x):
        girada = pagina.rotate(angulo, expand=True, resample=Image.BICUBIC)
        x = x0 + passo * coluna - (girada.width - pagina.width) // 2
        y = (A - girada.height) // 2
        sombreada, margem = sombra(girada)
        tela.paste(sombreada, (x - margem, y - margem), sombreada)
        tela.paste(girada, (x, y), girada)

    tela.save(destino, quality=88, optimize=True)
    print("· cartão de compartilhamento:", os.path.relpath(destino, RAIZ))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", help="usa um PDF pronto em vez de gerar um novo")
    args = ap.parse_args()

    try:
        from PIL import Image  # noqa: F401
        import pypdfium2  # noqa: F401
    except ImportError:
        sys.exit("Faltam dependências. Rode: pip install pypdfium2 pillow")

    temporario = None
    if args.pdf:
        pdf_path = os.path.abspath(args.pdf)
    else:
        temporario = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        temporario.close()
        pdf_path = temporario.name
        gerar_pdf(pdf_path)

    os.makedirs(SAIDA, exist_ok=True)
    pdf, paginas = paginas_do_pdf(pdf_path)
    total = len(paginas)
    print("· %d páginas no relatório" % total)

    imagens = {}
    for nome, procurado in PAGINAS.items():
        alvo = normaliza(procurado)
        indice = next((i for i, (texto, _) in enumerate(paginas) if casa(alvo, texto)), None)
        achou = paginas[indice][1] if indice is not None else None
        if achou is None:
            print("  ! não achei a página de '%s' — pulando" % procurado)
            continue
        largura_pt = achou.get_size()[0]
        img = achou.render(scale=LARGURA / largura_pt).to_pil()
        destino = os.path.join(SAIDA, nome + ".webp")
        img.save(destino, "WEBP", quality=82, method=6)
        imagens[nome] = img
        # A legenda de cada cartão na LP diz "seção N de M" — a mesma
        # numeração impressa na página. Se o relatório ganhar ou perder
        # seções, é esta linha que avisa o que atualizar lá.
        secao = numero_da_secao(paginas[indice][0])
        selo = ("seção %2d de %d" % secao) if secao else "sem numeração"
        print("  · %-22s pdf p.%-3d %-16s %d KB" % (nome, indice + 1, selo,
                                                    os.path.getsize(destino) // 1024))

    if all(n in imagens for n in CARTAO):
        monta_cartao(imagens, os.path.join(SAIDA, "modelo-cartao.jpg"))

    pdf.close()
    if temporario:
        os.unlink(temporario.name)
    print("pronto.")


if __name__ == "__main__":
    main()
