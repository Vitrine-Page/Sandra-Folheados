// ==========================================
// CONEXÃO COM O SUPABASE
// ==========================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// ESTADO
// ==========================================

let produtosAtuais = [];
let categoriasAtuais = [];
let categoriaSelecionada = "__todos__";


// ==========================================
// ELEMENTOS DO MODAL
// ==========================================

const produtoModal =
    document.getElementById("produto-modal");

const modalImagem =
    document.getElementById("modal-imagem");

const modalNome =
    document.getElementById("modal-nome");

const modalDescricao =
    document.getElementById("modal-descricao");

const modalPreco =
    document.getElementById("modal-preco");

const modalCategoria =
    document.getElementById("modal-categoria");

const modalWhatsApp =
    document.getElementById("modal-whatsapp");

const fecharModal =
    document.getElementById("fechar-modal");

const modalOverlay =
    document.querySelector(".produto-modal-overlay");


// ==========================================
// SEGURANÇA / FORMATAÇÃO
// ==========================================

function escaparHTML(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatarPreco(valor) {
    return Number(valor || 0)
        .toFixed(2)
        .replace(".", ",");
}


// ==========================================
// CRIAR LINK DE WHATSAPP DO PRODUTO
// ==========================================

function criarLinkWhatsApp(produto) {

    const numero =
        SITE_CONFIG.whatsapp;

    if (!numero) {
        return "#";
    }

    const imagemUrl =
        String(
            produto.imagem_url || ""
        ).trim();


    const mensagem =
        `Olá! Tenho interesse no produto:\n\n` +
        `*${produto.nome}*\n` +
        `Valor: R$ ${formatarPreco(produto.preco)}\n` +
        `${
            imagemUrl
                ? `\nFoto do produto:\n${imagemUrl}\n`
                : ""
        }\n` +
        `Gostaria de saber mais informações.`;

    return (
        `https://wa.me/${numero}` +
        `?text=${encodeURIComponent(mensagem)}`
    );
}


// ==========================================
// CONFIGURAR LINKS DO SITE
// ==========================================

function configurarLinks() {

    // ======================================
    // WHATSAPP
    // ======================================

    document
        .querySelectorAll(".btn-whatsapp")
        .forEach(botao => {

            if (SITE_CONFIG.whatsapp) {

                botao.href =
                    `https://wa.me/${SITE_CONFIG.whatsapp}`;
            }

            botao.target = "_blank";

            botao.rel =
                "noopener noreferrer";
        });


    // ======================================
    // INSTAGRAM
    // ======================================

    document
        .querySelectorAll(".btn-instagram")
        .forEach(botao => {

            if (SITE_CONFIG.instagram) {

                botao.href =
                    SITE_CONFIG.instagram;
            }

            botao.target = "_blank";

            botao.rel =
                "noopener noreferrer";
        });
}


// ==========================================
// ABRIR MODAL DO PRODUTO
// ==========================================

function abrirProduto(produto) {

    if (!produtoModal) {
        return;
    }


    // ======================================
    // IMAGEM
    // ======================================

    if (modalImagem) {

        modalImagem.src =
            produto.imagem_url || "";

        modalImagem.alt =
            produto.nome || "";
    }


    // ======================================
    // NOME
    // ======================================

    if (modalNome) {

        modalNome.textContent =
            produto.nome || "";
    }


    // ======================================
    // DESCRIÇÃO
    // ======================================

    if (modalDescricao) {

        modalDescricao.textContent =
            produto.descricao || "";
    }


    // ======================================
    // PREÇO
    // ======================================

    if (modalPreco) {

        modalPreco.textContent =
            `R$ ${formatarPreco(produto.preco)}`;
    }


    // ======================================
    // CATEGORIA
    // ======================================

    if (modalCategoria) {

        modalCategoria.textContent =
            produto.categoria || "";
    }


    // ======================================
    // WHATSAPP
    // ======================================

    if (modalWhatsApp) {

        modalWhatsApp.href =
            criarLinkWhatsApp(produto);

        modalWhatsApp.target =
            "_blank";

        modalWhatsApp.rel =
            "noopener noreferrer";
    }


    // ======================================
    // ABRIR MODAL
    // ======================================

    produtoModal.classList.add("aberto");

    produtoModal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";
}


// ==========================================
// FECHAR MODAL
// ==========================================

function fecharProdutoModal() {

    if (!produtoModal) {
        return;
    }

    produtoModal.classList.remove(
        "aberto"
    );

    produtoModal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow =
        "";
}


// ==========================================
// EVENTO BOTÃO FECHAR
// ==========================================

if (fecharModal) {

    fecharModal.addEventListener(
        "click",
        fecharProdutoModal
    );
}


// ==========================================
// FECHAR CLICANDO NO FUNDO
// ==========================================

if (modalOverlay) {

    modalOverlay.addEventListener(
        "click",
        fecharProdutoModal
    );
}


// ==========================================
// FECHAR COM ESC
// ==========================================

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            produtoModal?.classList.contains("aberto")
        ) {

            fecharProdutoModal();
        }
    }
);


// ==========================================
// MONTAR CATEGORIAS
// ==========================================

function montarCategorias(produtos) {

    const mapa =
        new Map();


    // ======================================
    // CATEGORIAS CADASTRADAS NO BANCO
    // ======================================

    categoriasAtuais.forEach(
        categoria => {

            const nome =
                String(
                    categoria.nome || ""
                ).trim();

            if (!nome) {
                return;
            }

            mapa.set(
                nome.toLowerCase(),
                {
                    nome,
                    imagem_url: ""
                }
            );
        }
    );


    // ======================================
    // CATEGORIAS EXISTENTES NOS PRODUTOS
    // ======================================

    produtos.forEach(
        produto => {

            const nome =
                String(
                    produto.categoria || ""
                ).trim();

            if (!nome) {
                return;
            }

            const chave =
                nome.toLowerCase();


            if (!mapa.has(chave)) {

                mapa.set(
                    chave,
                    {
                        nome,
                        imagem_url:
                            produto.imagem_url || ""
                    }
                );

                return;
            }


            const categoria =
                mapa.get(chave);


            if (
                !categoria.imagem_url &&
                produto.imagem_url
            ) {

                categoria.imagem_url =
                    produto.imagem_url;
            }
        }
    );


    // ======================================
    // FALLBACK DA CATEGORIA
    // ======================================

    const imagemFallback =
        produtos.find(
            produto =>
                produto.imagem_url
        )?.imagem_url || "";


    mapa.forEach(
        categoria => {

            if (
                categoria.imagem_url
            ) {
                return;
            }


            const produto =
                produtos.find(
                    item =>
                        String(
                            item.categoria || ""
                        )
                            .trim()
                            .toLowerCase() ===
                        categoria.nome
                            .toLowerCase() &&
                        item.imagem_url
                );


            categoria.imagem_url =
                produto?.imagem_url ||
                imagemFallback;
        }
    );


    // ======================================
    // RETORNAR ORDENADO
    // ======================================

    return [...mapa.values()]
        .sort(
            (a, b) =>
                a.nome.localeCompare(
                    b.nome,
                    "pt-BR"
                )
        );
}


// ==========================================
// RENDERIZAR FILTROS DE CATEGORIA
// ==========================================

function renderizarFiltros() {

    const wrap =
        document.querySelector(
            ".filtro-categoria-wrap"
        );

    if (!wrap) {
        return;
    }

    wrap.innerHTML =
        "";


    // ======================================
    // TODOS
    // ======================================

    const todos =
        document.createElement(
            "button"
        );

    todos.type =
        "button";

    todos.className =
        `filtro-categoria ${
            categoriaSelecionada === "__todos__"
                ? "ativo"
                : ""
        }`;

    todos.dataset.categoria =
        "__todos__";

    todos.textContent =
        "Todos";

    wrap.appendChild(
        todos
    );


    // ======================================
    // CATEGORIAS
    // ======================================

    categoriasAtuais.forEach(
        categoria => {

            const botao =
                document.createElement(
                    "button"
                );

            botao.type =
                "button";

            botao.className =
                `filtro-categoria ${
                    categoriaSelecionada.toLowerCase() ===
                    categoria.nome.toLowerCase()
                        ? "ativo"
                        : ""
                }`;

            botao.dataset.categoria =
                categoria.nome;

            botao.textContent =
                categoria.nome;

            wrap.appendChild(
                botao
            );
        }
    );
}


// ==========================================
// RENDERIZAR CATEGORIAS
// ==========================================

// ==========================================
// ARRASTAR CATEGORIAS
// ==========================================

function configurarArrasteCategorias() {

    const grid =
        document.getElementById(
            "categorias-grid"
        );

    if (
        !grid ||
        grid.dataset.arrasteConfigurado === "true"
    ) {
        return;
    }

    grid.dataset.arrasteConfigurado =
        "true";

    const atualizarControles =
        () => {

            const podeRolar =
                grid.scrollWidth >
                grid.clientWidth + 1;

            document.querySelectorAll(
                ".categorias-seta"
            ).forEach(
                botao => {

                    const anterior =
                        botao.dataset.categoriasDirecao ===
                        "anterior";

                    botao.disabled =
                        !podeRolar ||
                        (anterior
                            ? grid.scrollLeft <= 1
                            : grid.scrollLeft >=
                                grid.scrollWidth -
                                grid.clientWidth - 1);
                }
            );
        };

    document.querySelectorAll(
        ".categorias-seta"
    ).forEach(
        botao => {

            botao.addEventListener(
                "click",
                () => {

                    const direcao =
                        botao.dataset.categoriasDirecao ===
                        "anterior"
                            ? -1
                            : 1;

                    grid.scrollBy({
                        left:
                            direcao *
                            Math.round(
                                grid.clientWidth * .8
                            ),
                        behavior: "smooth"
                    });
                }
            );
        }
    );

    grid.addEventListener(
        "scroll",
        atualizarControles,
        { passive: true }
    );

    new ResizeObserver(
        atualizarControles
    ).observe(grid);

    let inicioX = 0;
    let scrollInicial = 0;
    let ponteiroAtivo = null;
    let houveArraste = false;
    let bloquearClique = false;

    const distanciaMinima = 6;

    const encerrarArraste =
        evento => {

            if (
                ponteiroAtivo !==
                evento.pointerId
            ) {
                return;
            }

            grid.classList.remove(
                "arrastando"
            );

            if (
                houveArraste
            ) {
                bloquearClique =
                    true;

                requestAnimationFrame(
                    () => {
                        bloquearClique =
                            false;
                    }
                );
            }

            ponteiroAtivo = null;
        };

    grid.addEventListener(
        "pointerdown",
        evento => {

            // Toques usam a rolagem nativa do navegador, mais confiável
            // em iOS e Android. O arraste manual fica só para mouse.
            if (
                evento.pointerType !== "mouse" ||
                evento.button !== 0
            ) {
                return;
            }

            inicioX = evento.clientX;
            scrollInicial = grid.scrollLeft;
            ponteiroAtivo = evento.pointerId;
            houveArraste = false;
        }
    );

    grid.addEventListener(
        "pointermove",
        evento => {

            if (
                ponteiroAtivo !==
                evento.pointerId
            ) {
                return;
            }

            const deslocamento =
                evento.clientX - inicioX;

            if (
                !houveArraste &&
                Math.abs(deslocamento) <
                distanciaMinima
            ) {
                return;
            }

            houveArraste = true;

            if (
                !grid.hasPointerCapture(
                    evento.pointerId
                )
            ) {
                grid.setPointerCapture(
                    evento.pointerId
                );
            }

            grid.classList.add(
                "arrastando"
            );

            grid.scrollLeft =
                scrollInicial - deslocamento;

            evento.preventDefault();
        }
    );

    grid.addEventListener(
        "pointerup",
        encerrarArraste
    );

    grid.addEventListener(
        "pointercancel",
        encerrarArraste
    );

    grid.addEventListener(
        "lostpointercapture",
        encerrarArraste
    );

    grid.addEventListener(
        "click",
        evento => {

            if (
                !bloquearClique
            ) {
                return;
            }

            evento.preventDefault();
            evento.stopPropagation();
        },
        true
    );

    grid.addEventListener(
        "dragstart",
        evento => evento.preventDefault()
    );
}


function renderizarCategorias(produtos) {

    const grid =
        document.getElementById(
            "categorias-grid"
        );

    if (!grid) {
        return;
    }


    categoriasAtuais =
        montarCategorias(
            produtos
        );

    grid.innerHTML =
        "";


    // ======================================
    // NENHUMA CATEGORIA
    // ======================================

    if (
        !categoriasAtuais.length
    ) {

        grid.innerHTML = `
            <p class="categorias-vazia">
                Nenhuma categoria disponível.
            </p>
        `;

        renderizarFiltros();

        grid.dispatchEvent(
            new Event("scroll")
        );

        return;
    }


    // ======================================
    // CARDS DAS CATEGORIAS
    // ======================================

    categoriasAtuais.forEach(
        categoria => {

            const button =
                document.createElement(
                    "button"
                );

            button.type =
                "button";

            button.className =
                `categoria-card ${
                    categoriaSelecionada.toLowerCase() ===
                    categoria.nome.toLowerCase()
                        ? "ativo"
                        : ""
                }`;

            button.dataset.categoria =
                categoria.nome;


            button.innerHTML = `

                ${
                    categoria.imagem_url
                        ? `
                            <img
                                src="${escaparHTML(
                                    categoria.imagem_url
                                )}"
                                alt="${escaparHTML(
                                    categoria.nome
                                )}"
                            >
                        `
                        : ""
                }

                <span class="categoria-card-content">

                    <strong>
                        ${escaparHTML(
                            categoria.nome
                        )}
                    </strong>

                    <span>
                        →
                    </span>

                </span>
            `;


            button.addEventListener(
                "click",
                () => {

                    selecionarCategoria(
                        categoria.nome
                    );
                }
            );


            grid.appendChild(
                button
            );
        }
    );


    renderizarFiltros();

    grid.dispatchEvent(
        new Event("scroll")
    );
}


// ==========================================
// SELECIONAR CATEGORIA
// ==========================================

// ==========================================
// SELECIONAR CATEGORIA
// ==========================================

function selecionarCategoria(nome) {

    categoriaSelecionada = nome;

    renderizarCategorias(
        produtosAtuais
    );

    renderizarProdutos();


    // ======================================
    // ROLAR A PÁGINA SUAVEMENTE ATÉ A VITRINE
    // ======================================

    setTimeout(() => {

        const vitrine =
            document.getElementById("vitrine");

        if (!vitrine) {
            return;
        }

        const header =
            document.querySelector(".site-header");

        const alturaHeader =
            header
                ? header.getBoundingClientRect().height
                : 0;

        const distanciaTopo = 20;

        const destino =
            vitrine.getBoundingClientRect().top +
            window.pageYOffset -
            alturaHeader -
            distanciaTopo;

        window.scrollTo({
            top: destino,
            left: 0,
            behavior: "smooth"
        });

    }, 100);

}


// ==========================================
// RENDERIZAR PRODUTOS
// ==========================================

function renderizarProdutos() {

    const container =
        document.getElementById(
            "produtos"
        );

    if (!container) {
        return;
    }


    // ======================================
    // FILTRAR
    // ======================================

    const filtrados =
        categoriaSelecionada === "__todos__"

            ? produtosAtuais

            : produtosAtuais.filter(
                produto =>

                    String(
                        produto.categoria || ""
                    )
                        .trim()
                        .toLowerCase() ===

                    categoriaSelecionada
                        .toLowerCase()
            );


    // ======================================
    // NENHUM RESULTADO
    // ======================================

    if (!filtrados.length) {

        container.innerHTML = `
            <p class="estado-produtos">
                Nenhum produto encontrado.
            </p>
        `;

        return;
    }


    // ======================================
    // LIMPAR CONTAINER
    // ======================================

    container.innerHTML =
        "";


    // ======================================
    // CRIAR CARDS
    // ======================================

    filtrados.forEach(
        produto => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "produto-card";


            card.innerHTML = `

                <img
                    class="produto-card-image"
                    src="${escaparHTML(
                        produto.imagem_url || ""
                    )}"
                    alt="${escaparHTML(
                        produto.nome || ""
                    )}"
                >

                <div class="produto-card-info">

                    <h3>
                        ${escaparHTML(
                            produto.nome || ""
                        )}
                    </h3>

                    <p>
                        ${escaparHTML(
                            produto.descricao || ""
                        )}
                    </p>

                    <div class="preco">
                        R$
                        ${formatarPreco(
                            produto.preco
                        )}
                    </div>

                    <a
                        class="btn-produto-whatsapp"
                        href="${escaparHTML(
                            criarLinkWhatsApp(produto)
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Comprar pelo WhatsApp
                    </a>

                </div>
            `;


            // ==================================
            // ABRIR MODAL
            // ==================================

            card.addEventListener(
                "click",
                event => {

                    if (
                        event.target.closest(
                            ".btn-produto-whatsapp"
                        )
                    ) {
                        return;
                    }

                    abrirProduto(
                        produto
                    );
                }
            );


            container.appendChild(
                card
            );
        }
    );
}


// ==========================================
// EVENTOS DOS FILTROS
// ==========================================

document.addEventListener(
    "click",
    event => {

        const filtro =
            event.target.closest(
                ".filtro-categoria"
            );

        if (!filtro) {
            return;
        }


        selecionarCategoria(
            filtro.dataset.categoria
        );
    }
);


// ==========================================
// CARREGAR CATEGORIAS DO BANCO
// ==========================================

async function carregarCategoriasDoBanco() {

    if (
        !SITE_CONFIG?.vitrineId
    ) {
        return [];
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("categorias")
            .select(
                "id, nome, vitrine_id, criado_em"
            )
            .eq(
                "vitrine_id",
                SITE_CONFIG.vitrineId
            )
            .order(
                "criado_em",
                {
                    ascending: true
                }
            );


    // ======================================
    // ERRO
    // ======================================

    if (error) {

        console.warn(
            "Categorias não puderam ser carregadas. " +
            "Usando as categorias presentes nos produtos.",
            error
        );

        return [];
    }


    return data || [];
}


// ==========================================
// CARREGAR PRODUTOS
// ==========================================

async function carregarProdutos() {

    const container =
        document.getElementById(
            "produtos"
        );

    if (!container) {
        return;
    }


    // ======================================
    // VERIFICAR VITRINE
    // ======================================

    if (
        !SITE_CONFIG?.vitrineId
    ) {

        container.innerHTML = `
            <p class="estado-produtos">
                Vitrine não configurada.
            </p>
        `;

        return;
    }


    // ======================================
    // CARREGANDO
    // ======================================

    container.innerHTML = `
        <p class="estado-produtos">
            Carregando produtos...
        </p>
    `;


    // ======================================
    // BUSCAR PRODUTOS
    // ======================================

    const {
        data,
        error
    } =
        await supabaseClient
            .from("produtos")
            .select("*")
            .eq(
                "ativo",
                true
            )
            .eq(
                "vitrine_id",
                SITE_CONFIG.vitrineId
            )
            .order(
                "criado_em",
                {
                    ascending: false
                }
            );


    // ======================================
    // ERRO
    // ======================================

    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        container.innerHTML = `
            <p class="estado-produtos">
                Erro ao carregar produtos.
            </p>
        `;

        return;
    }


    // ======================================
    // SALVAR PRODUTOS
    // ======================================

    produtosAtuais =
        data || [];


    // ======================================
    // CARREGAR CATEGORIAS
    // ======================================

    categoriasAtuais =
        await carregarCategoriasDoBanco();


    // ======================================
    // CATEGORIAS
    // ======================================

    renderizarCategorias(
        produtosAtuais
    );


    // ======================================
    // PRODUTOS
    // ======================================

    renderizarProdutos();
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarSite() {

    configurarArrasteCategorias();

    configurarLinks();

    await carregarProdutos();
}


// ==========================================
// EXECUTAR QUANDO HTML ESTIVER PRONTO
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarSite
    );

} else {

    iniciarSite();
}