// ==========================================
// CONEXÃO COM O SUPABASE
// ==========================================

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);


// ==========================================
// ELEMENTOS DO DOM
// ==========================================

const formulario =
    document.getElementById("produto-form");

const mensagem =
    document.getElementById("mensagem");

const listaProdutos =
    document.getElementById("lista-produtos");

const campoImagem =
    document.getElementById("imagem");

const previewContainer =
    document.getElementById("preview-container");

const btnSair =
    document.getElementById("btn-sair");

const selecaoTipoCadastro =
    document.getElementById(
        "selecao-tipo-cadastro"
    );

const areaCadastro =
    document.getElementById(
        "area-cadastro"
    );

const blocoCadastroIndividual =
    document.getElementById(
        "bloco-cadastro-individual"
    );

const areaCadastroLote =
    document.getElementById(
        "area-cadastro-lote"
    );

const btnEscolherProduto =
    document.getElementById(
        "btn-escolher-produto"
    );

const btnEscolherLote =
    document.getElementById(
        "btn-escolher-lote"
    );

const btnVoltarCadastro =
    document.getElementById(
        "btn-voltar-cadastro"
    );


// ==========================================
// INDICADOR DO MODO DE CADASTRO
// ==========================================

const indicadorModoCadastroTitulo =
    document.getElementById(
        "indicador-modo-cadastro-titulo"
    );

const indicadorModoCadastroTipo =
    document.getElementById(
        "indicador-modo-cadastro-tipo"
    );


// ==========================================
// ESTADO
// ==========================================

let produtoEditando = null;

let previewUrlAtual = null;

let vitrineAtual = null;

let categoriasAdmin = [];

let produtosEmLote = [];

let modoCadastroAtual = null;


// ==========================================
// LOGIN
// ==========================================

async function verificarLogin() {

    const {
        data,
        error
    } = await supabaseClient.auth.getUser();

    if (error || !data.user) {

        window.location.href =
            "login.html";

        return false;
    }

    console.log(
        "Administrador autenticado:",
        data.user.email
    );

    return true;
}


// ==========================================
// BUSCAR VITRINE DO ADMINISTRADOR
// ==========================================

async function carregarVitrineAtual() {

    const {
        data: usuarioData,
        error: usuarioError
    } = await supabaseClient.auth.getUser();


    if (
        usuarioError ||
        !usuarioData.user
    ) {

        console.error(
            "Não foi possível identificar o usuário."
        );

        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admin_vitrines")
            .select(`
                vitrine_id,
                vitrines (
                    id,
                    nome,
                    whatsapp,
                    instagram
                )
            `)
            .eq(
                "usuario_id",
                usuarioData.user.id
            )
            .single();


    if (error) {

        console.error(
            "Erro ao buscar vitrine:",
            error
        );

        return false;
    }


    if (!data) {

        console.error(
            "Nenhuma vitrine vinculada ao administrador."
        );

        return false;
    }


    vitrineAtual =
        data.vitrines;


    if (!SITE_CONFIG?.vitrineId) {

        console.error(
            "O vitrineId não foi configurado no site-config.js."
        );


        mostrarMensagem(
            "A vitrine deste projeto não foi configurada."
        );

        return false;
    }


    if (
        vitrineAtual.id !==
        SITE_CONFIG.vitrineId
    ) {

        console.error(
            "Este administrador não pertence a esta vitrine."
        );


        mostrarMensagem(
            "Este administrador não pertence a esta vitrine."
        );


        await supabaseClient.auth.signOut();


        window.location.href =
            "login.html";


        return false;
    }


    console.log(
        "Vitrine atual:",
        vitrineAtual
    );


    return true;
}


// ==========================================
// SAIR
// ==========================================

if (btnSair) {

    btnSair.addEventListener(
        "click",
        async () => {

            btnSair.disabled =
                true;

            btnSair.textContent =
                "Saindo...";


            const {
                error
            } =
                await supabaseClient.auth.signOut();


            if (error) {

                console.error(
                    "Erro ao sair:",
                    error
                );


                btnSair.disabled =
                    false;

                btnSair.textContent =
                    "Sair";

                return;
            }


            window.location.href =
                "login.html";

        }
    );

}


// ==========================================
// SELEÇÃO DO TIPO DE CADASTRO
// ==========================================

function configurarSelecaoTipoCadastro() {

    if (btnEscolherProduto) {

        btnEscolherProduto.addEventListener(
            "click",
            () => {

                abrirCadastro(
                    "individual"
                );

            }
        );

    }


    if (btnEscolherLote) {

        btnEscolherLote.addEventListener(
            "click",
            () => {

                abrirCadastro(
                    "lote"
                );

            }
        );

    }


    if (btnVoltarCadastro) {

        btnVoltarCadastro.addEventListener(
            "click",
            voltarParaSelecaoCadastro
        );

    }

}


// ==========================================
// ABRIR CADASTRO
// ==========================================

function abrirCadastro(modo) {

    if (
        modo !== "individual" &&
        modo !== "lote"
    ) {

        return;
    }


    modoCadastroAtual =
        modo;


    // ======================================
    // ATUALIZAR INDICADOR SUPERIOR
    // ======================================

    if (indicadorModoCadastroTitulo) {

        indicadorModoCadastroTitulo.textContent =
            modo === "individual"
                ? "Produto"
                : "Vários produtos";
    }


    if (indicadorModoCadastroTipo) {

        indicadorModoCadastroTipo.textContent =
            modo === "individual"
                ? "INDIVIDUAL"
                : "EM LOTE";
    }


    // ======================================
    // ESCONDER SELEÇÃO
    // ======================================

    if (selecaoTipoCadastro) {

        selecaoTipoCadastro.hidden =
            true;
    }


    // ======================================
    // MOSTRAR ÁREA DE CADASTRO
    // ======================================

    if (areaCadastro) {

        areaCadastro.hidden =
            false;
    }


    // ======================================
    // CONTROLAR MODO INDIVIDUAL
    // ======================================

    if (blocoCadastroIndividual) {

        blocoCadastroIndividual.hidden =
            modo !== "individual";
    }


    // ======================================
    // CONTROLAR MODO LOTE
    // ======================================

    if (areaCadastroLote) {

        areaCadastroLote.hidden =
            modo !== "lote";
    }


    // ======================================
    // PREPARAR MODO ESCOLHIDO
    // ======================================

    if (modo === "lote") {

        prepararCadastroLote();

    } else {

        prepararCadastroIndividual();

    }

}


// ==========================================
// VOLTAR PARA SELEÇÃO
// ==========================================

function voltarParaSelecaoCadastro() {

    produtoEditando = null;

    limparFormularioIndividual();

    limparCadastroLote();

    modoCadastroAtual = null;


    if (areaCadastro) {

        areaCadastro.hidden =
            true;
    }


    if (selecaoTipoCadastro) {

        selecaoTipoCadastro.hidden =
            false;
    }


    if (blocoCadastroIndividual) {

        blocoCadastroIndividual.hidden =
            true;
    }


    if (areaCadastroLote) {

        areaCadastroLote.hidden =
            true;
    }


    if (indicadorModoCadastroTitulo) {

        indicadorModoCadastroTitulo.textContent =
            "Produto";
    }


    if (indicadorModoCadastroTipo) {

        indicadorModoCadastroTipo.textContent =
            "INDIVIDUAL";
    }


    restaurarModoCadastro();

    mostrarMensagem("");
}


// ==========================================
// PREPARAR CADASTRO INDIVIDUAL
// ==========================================

function prepararCadastroIndividual() {

    if (campoImagem) {

        campoImagem.multiple =
            false;

        campoImagem.required =
            !produtoEditando;
    }


    const nome =
        document.getElementById("nome");

    const preco =
        document.getElementById("preco");

    const categoria =
        document.getElementById("categoria");


    if (nome) {

        nome.required =
            true;
    }


    if (preco) {

        preco.required =
            true;
    }


    if (categoria) {

        categoria.required =
            true;
    }


    const categoriaLote =
        document.getElementById(
            "lote-categoria"
        );


    if (categoriaLote) {

        categoriaLote.required =
            false;
    }


    if (areaCadastroLote) {

        areaCadastroLote.hidden =
            true;
    }


    if (blocoCadastroIndividual) {

        blocoCadastroIndividual.hidden =
            false;
    }

}


// ==========================================
// PREPARAR CADASTRO EM LOTE
// ==========================================

function prepararCadastroLote() {

    if (campoImagem) {

        campoImagem.required =
            false;

        campoImagem.multiple =
            false;
    }


    const nome =
        document.getElementById("nome");

    const preco =
        document.getElementById("preco");

    const categoria =
        document.getElementById("categoria");


    if (nome) {

        nome.required =
            false;
    }


    if (preco) {

        preco.required =
            false;
    }


    if (categoria) {

        categoria.required =
            false;
    }


    const categoriaLote =
        document.getElementById(
            "lote-categoria"
        );


    if (categoriaLote) {

        categoriaLote.required =
            false;
    }


    if (blocoCadastroIndividual) {

        blocoCadastroIndividual.hidden =
            true;
    }


    if (areaCadastroLote) {

        areaCadastroLote.hidden =
            false;
    }


    atualizarSelectCategoriaLote();
}


// ==========================================
// SUBMIT DO FORMULÁRIO INDIVIDUAL
// ==========================================

if (formulario) {

    formulario.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (
                modoCadastroAtual !==
                "individual"
            ) {

                return;
            }


            const campoNome =
                document.getElementById("nome");

            const campoDescricao =
                document.getElementById("descricao");

            const campoPreco =
                document.getElementById("preco");

            const campoCategoria =
                document.getElementById("categoria");


            const nome =
                campoNome?.value?.trim() || "";

            const descricao =
                campoDescricao?.value?.trim() || "";

            const preco =
                Number(
                    campoPreco?.value
                );

            const categoria =
                campoCategoria?.value?.trim() || "";

            const imagem =
                campoImagem?.files?.[0] ||
                null;


            if (!nome) {

                mostrarMensagem(
                    "Digite o nome do produto."
                );

                return;
            }


            if (
                Number.isNaN(preco) ||
                preco < 0
            ) {

                mostrarMensagem(
                    "Digite um preço válido."
                );

                return;
            }


            if (!categoria) {

                mostrarMensagem(
                    "Escolha uma categoria."
                );

                return;
            }


            if (
                !imagem &&
                !produtoEditando
            ) {

                mostrarMensagem(
                    "Escolha uma imagem para o produto."
                );

                return;
            }


            if (!vitrineAtual?.id) {

                mostrarMensagem(
                    "Não foi possível identificar a vitrine."
                );

                return;
            }


            if (produtoEditando) {

                await atualizarProduto({
                    nome,
                    descricao,
                    preco,
                    categoria,
                    imagem
                });

                return;
            }


            await cadastrarProduto({
                nome,
                descricao,
                preco,
                categoria,
                imagem
            });

        }
    );

}


// ==========================================
// COMPRIMIR IMAGEM
// ==========================================

async function comprimirImagem(
    arquivo,
    larguraMaxima = 1000,
    qualidade = 0.8
) {

    return new Promise(
        (resolve, reject) => {

            const imagem =
                new Image();

            const urlTemporaria =
                URL.createObjectURL(
                    arquivo
                );


            imagem.onload = () => {

                let largura =
                    imagem.width;

                let altura =
                    imagem.height;


                if (
                    largura >
                    larguraMaxima
                ) {

                    altura =
                        Math.round(
                            altura *
                            (
                                larguraMaxima /
                                largura
                            )
                        );

                    largura =
                        larguraMaxima;
                }


                const canvas =
                    document.createElement(
                        "canvas"
                    );


                canvas.width =
                    largura;

                canvas.height =
                    altura;


                const contexto =
                    canvas.getContext("2d");


                if (!contexto) {

                    URL.revokeObjectURL(
                        urlTemporaria
                    );


                    reject(
                        new Error(
                            "Não foi possível criar o canvas."
                        )
                    );


                    return;
                }


                contexto.drawImage(
                    imagem,
                    0,
                    0,
                    largura,
                    altura
                );


                canvas.toBlob(
                    blob => {

                        URL.revokeObjectURL(
                            urlTemporaria
                        );


                        if (!blob) {

                            reject(
                                new Error(
                                    "Não foi possível comprimir a imagem."
                                )
                            );


                            return;
                        }


                        const novoArquivo =
                            new File(
                                [blob],
                                "imagem-comprimida.jpg",
                                {
                                    type:
                                        "image/jpeg"
                                }
                            );


                        resolve(
                            novoArquivo
                        );

                    },
                    "image/jpeg",
                    qualidade
                );

            };


            imagem.onerror = () => {

                URL.revokeObjectURL(
                    urlTemporaria
                );


                reject(
                    new Error(
                        "Não foi possível carregar a imagem."
                    )
                );

            };


            imagem.src =
                urlTemporaria;

        }
    );
}


// ==========================================
// CADASTRAR PRODUTO INDIVIDUAL
// ==========================================

async function cadastrarProduto({
    nome,
    descricao,
    preco,
    categoria,
    imagem
}) {

    if (!imagem) {

        mostrarMensagem(
            "Escolha uma imagem para o produto."
        );

        return;
    }


    if (!vitrineAtual?.id) {

        mostrarMensagem(
            "Não foi possível identificar a vitrine."
        );

        return;
    }


    if (!categoria) {

        mostrarMensagem(
            "Escolha uma categoria."
        );

        return;
    }


    mostrarMensagem(
        "Comprimindo imagem..."
    );


    let imagemComprimida;


    try {

        imagemComprimida =
            await comprimirImagem(
                imagem,
                1000,
                0.8
            );

    } catch (erro) {

        console.error(
            "Erro ao comprimir imagem:",
            erro
        );


        mostrarMensagem(
            "Não foi possível processar a imagem."
        );


        return;
    }


    const nomeArquivo =
        criarNomeArquivo(
            imagemComprimida
        );


    if (!nomeArquivo) {

        mostrarMensagem(
            "Não foi possível preparar a imagem."
        );

        return;
    }


    mostrarMensagem(
        "Enviando imagem..."
    );


    const {
        data: arquivo,
        error: erroUpload
    } =
        await supabaseClient
            .storage
            .from("produtos")
            .upload(
                nomeArquivo,
                imagemComprimida,
                {
                    contentType:
                        "image/jpeg",

                    upsert:
                        false
                }
            );


    if (erroUpload) {

        console.error(
            "Erro no upload:",
            erroUpload
        );


        mostrarMensagem(
            "Erro ao enviar a imagem."
        );


        return;
    }


    console.log(
        "Imagem enviada:",
        arquivo
    );


    const imagemUrl =
        obterUrlPublica(
            nomeArquivo
        );


    if (!imagemUrl) {

        await removerImagem(
            nomeArquivo
        );


        mostrarMensagem(
            "Não foi possível gerar a URL da imagem."
        );


        return;
    }


    mostrarMensagem(
        "Salvando produto..."
    );


    const {
        data: produto,
        error: erroProduto
    } =
        await supabaseClient
            .from("produtos")
            .insert({
                nome,
                descricao,
                preco,
                categoria,
                imagem_url:
                    imagemUrl,
                imagem_path:
                    nomeArquivo,
                ativo:
                    true,
                vitrine_id:
                    vitrineAtual.id
            })
            .select()
            .single();


    if (erroProduto) {

        console.error(
            "Erro ao salvar produto:",
            erroProduto
        );


        await removerImagem(
            nomeArquivo
        );


        mostrarMensagem(
            "Erro ao salvar o produto."
        );


        return;
    }


    console.log(
        "Produto criado:",
        produto
    );


    mostrarMensagem(
        "Produto cadastrado com sucesso!"
    );


    limparFormularioIndividual();


    await carregarCategoriasAdmin();

    await carregarProdutos();

}


// ==========================================
// ATUALIZAR PRODUTO
// ==========================================

async function atualizarProduto({
    nome,
    descricao,
    preco,
    categoria,
    imagem
}) {

    if (!produtoEditando) {

        return;
    }


    if (!categoria) {

        mostrarMensagem(
            "Escolha uma categoria."
        );

        return;
    }


    mostrarMensagem(
        "Atualizando produto..."
    );


    const imagemAnteriorUrl =
        produtoEditando.imagem_url;


    const imagemAnteriorPath =
        produtoEditando.imagem_path ||
        extrairCaminhoImagem(
            imagemAnteriorUrl
        );


    let imagemUrl =
        imagemAnteriorUrl;

    let imagemPath =
        produtoEditando.imagem_path ||
        imagemAnteriorPath;

    let novaImagemPath =
        null;


    if (imagem) {

        mostrarMensagem(
            "Comprimindo nova imagem..."
        );


        let imagemComprimida;


        try {

            imagemComprimida =
                await comprimirImagem(
                    imagem,
                    1000,
                    0.8
                );

        } catch (erro) {

            console.error(
                "Erro ao comprimir nova imagem:",
                erro
            );


            mostrarMensagem(
                "Não foi possível processar a nova imagem."
            );


            return;
        }


        novaImagemPath =
            criarNomeArquivo(
                imagemComprimida
            );


        if (!novaImagemPath) {

            mostrarMensagem(
                "Não foi possível preparar a nova imagem."
            );

            return;
        }


        mostrarMensagem(
            "Enviando nova imagem..."
        );


        const {
            data: arquivo,
            error: erroUpload
        } =
            await supabaseClient
                .storage
                .from("produtos")
                .upload(
                    novaImagemPath,
                    imagemComprimida,
                    {
                        contentType:
                            "image/jpeg",

                        upsert:
                            false
                    }
                );


        if (erroUpload) {

            console.error(
                "Erro ao enviar nova imagem:",
                erroUpload
            );


            mostrarMensagem(
                "Erro ao enviar a nova imagem."
            );


            return;
        }


        console.log(
            "Nova imagem enviada:",
            arquivo
        );


        imagemUrl =
            obterUrlPublica(
                novaImagemPath
            );


        if (!imagemUrl) {

            await removerImagem(
                novaImagemPath
            );


            mostrarMensagem(
                "Não foi possível gerar a nova URL."
            );


            return;
        }


        imagemPath =
            novaImagemPath;
    }


    mostrarMensagem(
        "Salvando alterações..."
    );


    const {
        error: erroUpdate
    } =
        await supabaseClient
            .from("produtos")
            .update({
                nome,
                descricao,
                preco,
                categoria,
                imagem_url:
                    imagemUrl,
                imagem_path:
                    imagemPath
            })
            .eq(
                "id",
                produtoEditando.id
            );


    if (erroUpdate) {

        console.error(
            "Erro ao atualizar:",
            erroUpdate
        );


        if (novaImagemPath) {

            await removerImagem(
                novaImagemPath
            );
        }


        mostrarMensagem(
            "Erro ao atualizar o produto."
        );


        return;
    }


    if (
        novaImagemPath &&
        imagemAnteriorPath &&
        imagemAnteriorPath !==
            novaImagemPath
    ) {

        await removerImagem(
            imagemAnteriorPath
        );
    }


    produtoEditando =
        null;


    limparFormularioIndividual();

    restaurarModoCadastro();


    mostrarMensagem(
        "Produto atualizado com sucesso!"
    );


    await carregarCategoriasAdmin();

    await carregarProdutos();

}


// ==========================================
// CRIAR NOME DO ARQUIVO
// ==========================================

function criarNomeArquivo(imagem) {

    if (!vitrineAtual?.id) {

        return null;
    }


    const nomeOriginal =
        imagem.name.replace(
            /[^a-zA-Z0-9._-]/g,
            "-"
        );


    return (
        `${vitrineAtual.id}/${Date.now()}-${nomeOriginal}`
    );
}


// ==========================================
// OBTER URL PÚBLICA
// ==========================================

function obterUrlPublica(caminho) {

    const {
        data
    } =
        supabaseClient
            .storage
            .from("produtos")
            .getPublicUrl(
                caminho
            );


    return (
        data?.publicUrl ||
        null
    );
}


// ==========================================
// CARREGAR PRODUTOS
// ==========================================

async function carregarProdutos() {

    if (!listaProdutos) {

        return;
    }


    listaProdutos.innerHTML =
        "Carregando produtos...";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("produtos")
            .select("*")
            .eq(
                "vitrine_id",
                vitrineAtual.id
            )
            .order(
                "criado_em",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );


        listaProdutos.innerHTML = `
            <p>
                Não foi possível carregar os produtos.
            </p>
        `;


        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        listaProdutos.innerHTML = `
            <p>
                Nenhum produto cadastrado.
            </p>
        `;


        return;
    }


    listaProdutos.innerHTML =
        "";


    data.forEach(
        produto => {

            const card =
                document.createElement(
                    "div"
                );


            card.classList.add(
                "produto-admin"
            );


            card.innerHTML = `
                <img
                    src="${escaparHTMLAdmin(
                        produto.imagem_url
                    )}"
                    alt="${escaparHTMLAdmin(
                        produto.nome
                    )}"
                >

                <div class="produto-admin-info">

                    <h3>
                        ${escaparHTMLAdmin(
                            produto.nome
                        )}
                    </h3>

                    <p>
                        ${escaparHTMLAdmin(
                            produto.descricao ||
                            ""
                        )}
                    </p>

                    <strong>
                        R$ ${
                            Number(
                                produto.preco ||
                                0
                            )
                                .toFixed(2)
                                .replace(
                                    ".",
                                    ","
                                )
                        }
                    </strong>

                    <p>
                        Categoria:
                        ${escaparHTMLAdmin(
                            produto.categoria ||
                            "Sem categoria"
                        )}
                    </p>

                    <p>
                        Status:

                        <strong>
                            ${
                                produto.ativo
                                    ? "🟢 Ativo"
                                    : "🔴 Inativo"
                            }
                        </strong>
                    </p>

                    <div class="acoes-produto">

                        <button
                            class="btn-editar"
                            onclick="editarProduto('${produto.id}')"
                        >
                            ✏️ Editar
                        </button>

                        <button
                            class="btn-status"
                            onclick="alterarStatus(
                                '${produto.id}',
                                ${produto.ativo}
                            )"
                        >
                            ${
                                produto.ativo
                                    ? "🔴 Desativar"
                                    : "🟢 Ativar"
                            }
                        </button>

                        <button
                            class="btn-excluir"
                            onclick="excluirProduto('${produto.id}')"
                        >
                            🗑️ Excluir
                        </button>

                    </div>

                </div>
            `;


            listaProdutos.appendChild(
                card
            );

        }
    );

}


// ==========================================
// EDITAR PRODUTO
// ==========================================

async function editarProduto(id) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("produtos")
            .select("*")
            .eq(
                "id",
                id
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            )
            .single();


    if (error) {

        console.error(
            "Erro ao buscar produto:",
            error
        );

        return;
    }


    produtoEditando =
        data;


    abrirCadastro(
        "individual"
    );


    const campoNome =
        document.getElementById("nome");

    const campoDescricao =
        document.getElementById("descricao");

    const campoPreco =
        document.getElementById("preco");


    if (campoNome) {

        campoNome.value =
            data.nome || "";
    }


    if (campoDescricao) {

        campoDescricao.value =
            data.descricao || "";
    }


    if (campoPreco) {

        campoPreco.value =
            data.preco ?? "";
    }


    const selectCategoria =
        document.getElementById(
            "categoria"
        );


    if (selectCategoria) {

        const categoria =
            data.categoria || "";


        if (
            categoria &&
            !Array.from(
                selectCategoria.options
            ).some(
                option =>
                    option.value ===
                    categoria
            )
        ) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria;


            option.textContent =
                `${categoria} (existente)`;


            selectCategoria.appendChild(
                option
            );
        }


        selectCategoria.value =
            categoria;
    }


    if (
        previewContainer &&
        data.imagem_url
    ) {

        limparPreview();


        previewContainer.innerHTML = `
            <img
                src="${escaparHTMLAdmin(
                    data.imagem_url
                )}"
                alt="${escaparHTMLAdmin(
                    data.nome
                )}"
            >
        `;
    }


    restaurarModoCadastro();


    const botaoSalvar =
        formulario?.querySelector(
            'button[type="submit"]'
        );


    if (botaoSalvar) {

        botaoSalvar.textContent =
            "Atualizar produto";
    }


    mostrarBotaoCancelar();


    mostrarMensagem(
        `Editando: ${data.nome}`
    );
}


// ==========================================
// BOTÃO CANCELAR EDIÇÃO
// ==========================================

function mostrarBotaoCancelar() {

    if (
        document.getElementById(
            "btn-cancelar"
        )
    ) {

        return;
    }


    const botao =
        document.createElement(
            "button"
        );


    botao.id =
        "btn-cancelar";

    botao.type =
        "button";

    botao.textContent =
        "Cancelar edição";

    botao.classList.add(
        "btn-cancelar"
    );


    botao.addEventListener(
        "click",
        () => {

            produtoEditando =
                null;

            limparFormularioIndividual();

            restaurarModoCadastro();

            mostrarMensagem("");

            voltarParaSelecaoCadastro();
        }
    );


    formulario.appendChild(
        botao
    );
}


// ==========================================
// RESTAURAR MODO DE CADASTRO
// ==========================================

function restaurarModoCadastro() {

    const botaoSalvar =
        formulario?.querySelector(
            'button[type="submit"]'
        );


    if (botaoSalvar) {

        botaoSalvar.textContent =
            "Salvar produto";
    }


    const cancelar =
        document.getElementById(
            "btn-cancelar"
        );


    if (cancelar) {

        cancelar.remove();
    }
}


// ==========================================
// ALTERAR STATUS
// ==========================================

async function alterarStatus(
    id,
    statusAtual
) {

    const {
        error
    } =
        await supabaseClient
            .from("produtos")
            .update({
                ativo:
                    !statusAtual
            })
            .eq(
                "id",
                id
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            );


    if (error) {

        console.error(
            "Erro ao alterar status:",
            error
        );


        alert(
            "Não foi possível alterar o status."
        );


        return;
    }


    await carregarProdutos();
}


// ==========================================
// EXCLUIR PRODUTO
// ==========================================

async function excluirProduto(id) {

    const confirmar =
        confirm(
            "Tem certeza que deseja excluir este produto?"
        );


    if (!confirmar) {

        return;
    }


    const {
        data: produto,
        error: erroBusca
    } =
        await supabaseClient
            .from("produtos")
            .select("*")
            .eq(
                "id",
                id
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            )
            .single();


    if (erroBusca) {

        console.error(
            "Erro ao buscar produto:",
            erroBusca
        );

        return;
    }


    const {
        error: erroDelete
    } =
        await supabaseClient
            .from("produtos")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            );


    if (erroDelete) {

        console.error(
            "Erro ao excluir produto:",
            erroDelete
        );


        alert(
            "Não foi possível excluir o produto."
        );

        return;
    }


    const caminho =
        produto.imagem_path ||
        extrairCaminhoImagem(
            produto.imagem_url
        );


    if (caminho) {

        await removerImagem(
            caminho
        );
    }


    await carregarProdutos();
}


// ==========================================
// EXTRAIR CAMINHO DA IMAGEM
// ==========================================

function extrairCaminhoImagem(url) {

    if (!url) {

        return null;
    }


    const marcador =
        "/storage/v1/object/public/produtos/";


    const indice =
        url.indexOf(
            marcador
        );


    if (indice === -1) {

        return null;
    }


    return decodeURIComponent(
        url.substring(
            indice +
            marcador.length
        )
    );
}


// ==========================================
// REMOVER IMAGEM
// ==========================================

async function removerImagem(caminho) {

    if (!caminho) {

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .storage
            .from("produtos")
            .remove([
                caminho
            ]);


    if (error) {

        console.error(
            "Erro ao remover imagem:",
            error
        );
    }
}


// ==========================================
// LIMPAR PRÉVIA INDIVIDUAL
// ==========================================

function limparPreview() {

    if (!previewContainer) {

        return;
    }


    if (previewUrlAtual) {

        URL.revokeObjectURL(
            previewUrlAtual
        );

        previewUrlAtual =
            null;
    }


    previewContainer.innerHTML = `
        <p>
            Nenhuma imagem selecionada.
        </p>
    `;
}


// ==========================================
// PRÉVIA DA IMAGEM INDIVIDUAL
// ==========================================

if (campoImagem) {

    campoImagem.addEventListener(
        "change",
        () => {

            const arquivo =
                campoImagem.files?.[0] ||
                null;


            if (!arquivo) {

                limparPreview();

                return;
            }


            if (
                !arquivo.type.startsWith(
                    "image/"
                )
            ) {

                campoImagem.value =
                    "";

                limparPreview();


                mostrarMensagem(
                    "Selecione uma imagem válida."
                );

                return;
            }


            if (previewUrlAtual) {

                URL.revokeObjectURL(
                    previewUrlAtual
                );
            }


            previewUrlAtual =
                URL.createObjectURL(
                    arquivo
                );


            if (previewContainer) {

                previewContainer.innerHTML = `
                    <img
                        src="${previewUrlAtual}"
                        alt="Prévia da imagem"
                    >
                `;
            }

        }
    );
}


// ==========================================
// LIMPAR FORMULÁRIO INDIVIDUAL
// ==========================================

function limparFormularioIndividual() {

    const nome =
        document.getElementById("nome");

    const descricao =
        document.getElementById("descricao");

    const preco =
        document.getElementById("preco");

    const categoria =
        document.getElementById("categoria");


    if (nome) {

        nome.value =
            "";
    }


    if (descricao) {

        descricao.value =
            "";
    }


    if (preco) {

        preco.value =
            "";
    }


    if (categoria) {

        categoria.value =
            "";
    }


    if (campoImagem) {

        campoImagem.value =
            "";
    }


    limparPreview();
}


// ==========================================
// MOSTRAR MENSAGEM
// ==========================================

function mostrarMensagem(texto) {

    if (mensagem) {

        mensagem.textContent =
            texto;
    }
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHTMLAdmin(valor) {

    return String(valor ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}


// ==========================================
// CATEGORIAS
// ==========================================

function inserirGerenciadorCategorias() {

    const area =
        document.getElementById(
            "area-categorias"
        );


    if (
        !area ||
        document.getElementById(
            "gerenciador-categorias"
        )
    ) {

        return;
    }


    const secao =
        document.createElement(
            "section"
        );


    secao.id =
        "gerenciador-categorias";


    secao.innerHTML = `
        <h2>
            Categorias
        </h2>

        <p>
            Crie categorias para usar nos produtos.
        </p>

        <form
            id="categorias-admin-form"
        >

            <input
                id="categorias-admin-nome"
                type="text"
                maxlength="80"
                placeholder="Ex.: Brincos"
                autocomplete="off"
            >

            <button
                type="submit"
            >
                Criar categoria
            </button>

        </form>

        <p
            id="categoria-admin-status"
        ></p>

        <div
            id="lista-categorias-admin"
        ></div>
    `;


    area.appendChild(
        secao
    );


    const formCategorias =
        document.getElementById(
            "categorias-admin-form"
        );

    const input =
        document.getElementById(
            "categorias-admin-nome"
        );


    formCategorias.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const nome =
                input.value.trim();


            const status =
                document.getElementById(
                    "categoria-admin-status"
                );


            if (!nome) {

                status.textContent =
                    "Digite o nome da categoria.";

                return;
            }


            if (!vitrineAtual?.id) {

                status.textContent =
                    "Não foi possível identificar a vitrine.";

                return;
            }


            const existe =
                categoriasAdmin.some(
                    categoria =>
                        categoria.nome
                            .trim()
                            .toLowerCase() ===
                        nome.toLowerCase()
                );


            if (existe) {

                status.textContent =
                    "Essa categoria já existe.";

                return;
            }


            status.textContent =
                "Salvando categoria...";


            const {
                data,
                error
            } =
                await supabaseClient
                    .from("categorias")
                    .insert({
                        nome,
                        vitrine_id:
                            vitrineAtual.id
                    })
                    .select(
                        "id,nome,vitrine_id,criado_em"
                    )
                    .single();


            if (error) {

                console.error(
                    "Erro ao criar categoria:",
                    error
                );


                status.textContent =
                    "Não foi possível salvar a categoria.";

                return;
            }


            categoriasAdmin.push(
                data
            );


            input.value =
                "";


            status.textContent =
                "Categoria criada com sucesso.";


            atualizarSelectCategoriasAdmin();

            atualizarSelectCategoriaLote();

            renderizarCategoriasAdmin();

        }
    );
}


// ==========================================
// CARREGAR CATEGORIAS
// ==========================================

async function carregarCategoriasAdmin() {

    if (!vitrineAtual?.id) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("categorias")
            .select(
                "id,nome,vitrine_id,criado_em"
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            )
            .order(
                "nome",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.warn(
            "Erro ao carregar categorias:",
            error
        );


        categoriasAdmin = [];


        atualizarSelectCategoriasAdmin();

        atualizarSelectCategoriaLote();

        renderizarCategoriasAdmin();

        return;
    }


    categoriasAdmin =
        data || [];


    atualizarSelectCategoriasAdmin();

    atualizarSelectCategoriaLote();

    renderizarCategoriasAdmin();
}


// ==========================================
// SELECT DE CATEGORIAS
// ==========================================

function atualizarSelectCategoriasAdmin(
    valorAtual = null
) {

    const select =
        document.getElementById(
            "categoria"
        );


    if (!select) {

        return;
    }


    const valorAnterior =
        valorAtual ??
        select.value ??
        "";


    select.innerHTML = `
        <option value="">
            Selecione uma categoria
        </option>

        ${categoriasAdmin
            .map(
                categoria => `
                    <option
                        value="${escaparHTMLAdmin(
                            categoria.nome
                        )}"
                    >
                        ${escaparHTMLAdmin(
                            categoria.nome
                        )}
                    </option>
                `
            )
            .join("")}
    `;


    if (
        categoriasAdmin.some(
            categoria =>
                categoria.nome ===
                valorAnterior
        )
    ) {

        select.value =
            valorAnterior;
    }
}


// ==========================================
// SELECT DE CATEGORIA DO LOTE
// ==========================================

function montarOpcoesCategoriasLote(
    textoOpcaoInicial
) {

    return `
        <option value="">
            ${textoOpcaoInicial}
        </option>

        ${categoriasAdmin
            .map(
                categoria => `
                    <option
                        value="${escaparHTMLAdmin(
                            categoria.nome
                        )}"
                    >
                        ${escaparHTMLAdmin(
                            categoria.nome
                        )}
                    </option>
                `
            )
            .join("")}
    `;
}


function preencherSelectCategoriaLote(
    select,
    valorAtual,
    textoOpcaoInicial
) {

    if (!select) {

        return;
    }


    select.innerHTML =
        montarOpcoesCategoriasLote(
            textoOpcaoInicial
        );


    if (
        categoriasAdmin.some(
            categoria =>
                categoria.nome ===
                valorAtual
        )
    ) {

        select.value =
            valorAtual;
    }
}


function atualizarSelectCategoriaLote(
    valorAtual = null
) {

    const select =
        document.getElementById(
            "lote-categoria"
        );


    const valorAnterior =
        valorAtual ??
        select?.value ??
        "";


    preencherSelectCategoriaLote(
        select,
        valorAnterior,
        "Selecione uma categoria padrão"
    );


    if (select) {

        select.required =
            false;
    }


    document
        .querySelectorAll(
            '[data-lote-campo="categoria"]'
        )
        .forEach(
            selectIndividual => {

                preencherSelectCategoriaLote(
                    selectIndividual,
                    selectIndividual.value || "",
                    "Usar categoria padrão"
                );

            }
        );
}


// ==========================================
// LISTA DE CATEGORIAS
// ==========================================

function renderizarCategoriasAdmin() {

    const lista =
        document.getElementById(
            "lista-categorias-admin"
        );


    if (!lista) {

        return;
    }


    if (!categoriasAdmin.length) {

        lista.innerHTML =
            "<span>Nenhuma categoria criada ainda.</span>";

        return;
    }


    lista.innerHTML =
        categoriasAdmin
            .map(
                categoria => `
                    <span
                        class="categoria-admin-item"
                    >

                        <span>
                            ${escaparHTMLAdmin(
                                categoria.nome
                            )}
                        </span>

                        <button
                            type="button"
                            onclick="excluirCategoria('${categoria.id}')"
                        >
                            ×
                        </button>

                    </span>
                `
            )
            .join("");
}


// ==========================================
// EXCLUIR CATEGORIA
// ==========================================

async function excluirCategoria(id) {

    const categoria =
        categoriasAdmin.find(
            item =>
                item.id === id
        );


    if (!categoria) {

        return;
    }


    const confirmar =
        confirm(
            `Excluir a categoria "${categoria.nome}"?`
        );


    if (!confirmar) {

        return;
    }


    const {
        data: produtosUsando,
        error: erroVerificacao
    } =
        await supabaseClient
            .from("produtos")
            .select("id")
            .eq(
                "vitrine_id",
                vitrineAtual.id
            )
            .eq(
                "categoria",
                categoria.nome
            )
            .limit(1);


    if (erroVerificacao) {

        console.error(
            "Erro ao verificar categoria:",
            erroVerificacao
        );

        return;
    }


    if (
        produtosUsando &&
        produtosUsando.length
    ) {

        alert(
            "Essa categoria está associada a um produto. Troque a categoria do produto antes de excluí-la."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("categorias")
            .delete()
            .eq(
                "id",
                id
            )
            .eq(
                "vitrine_id",
                vitrineAtual.id
            );


    if (error) {

        console.error(
            "Erro ao excluir categoria:",
            error
        );


        alert(
            "Não foi possível excluir a categoria."
        );

        return;
    }


    categoriasAdmin =
        categoriasAdmin.filter(
            item =>
                item.id !== id
        );


    atualizarSelectCategoriasAdmin();

    atualizarSelectCategoriaLote();

    renderizarCategoriasAdmin();
}


// ==========================================
// INSERIR INTERFACE DO CADASTRO EM LOTE
// ==========================================

function inserirGerenciadorCadastroEmLote() {

    if (!areaCadastroLote) {

        return;
    }


    if (
        document.getElementById(
            "cadastro-lote"
        )
    ) {

        return;
    }


    const lote =
        document.createElement(
            "section"
        );


    lote.id =
        "cadastro-lote";


    lote.innerHTML = `
        <div class="cadastro-lote-topo">

            <div>

                <p class="lote-kicker">
                    CADASTRO EM LOTE
                </p>

                <h2>
                    Adicionar várias peças
                </h2>

                <p>
                    Selecione várias imagens e defina
                    uma categoria para cada peça, se necessário.
                </p>

            </div>

            <strong id="lote-contador">
                0 produtos
            </strong>

        </div>


        <div class="lote-campo lote-campo-categoria-padrao">

            <label for="lote-categoria">
                Categoria padrão
            </label>

            <div class="lote-categoria-padrao-controle">

                <select
                    id="lote-categoria"
                    name="categoria_lote"
                >

                    <option value="">
                        Selecione uma categoria padrão
                    </option>

                </select>

                <button
                    type="button"
                    data-aplicar="categoria"
                >
                    Aplicar a todos
                </button>

            </div>

            <small>
                Ela será usada nos produtos sem categoria individual.
            </small>

        </div>


        <div class="lote-campo">

            <label>
                Fotos dos produtos
            </label>

            <p class="lote-explicacao">
                Selecione várias imagens de uma vez.
            </p>

            <input
                type="file"
                id="lote-imagens"
                name="imagens_lote"
                accept="image/*"
                multiple
            >

            <label
                for="lote-imagens"
                class="lote-upload"
            >

                <span class="lote-upload-titulo">
                    Selecionar imagens
                </span>

                <span class="lote-upload-texto">
                    Escolha várias fotos da sua coleção
                </span>

                <span class="lote-upload-formatos">
                    JPG, PNG, WEBP e outros formatos
                </span>

            </label>

        </div>


        <div class="lote-aplicar-todos">

            <div class="lote-campo-massa">

                <label>
                    Nome para todos
                </label>

                <input
                    id="lote-nome-todos"
                    type="text"
                    placeholder="Opcional"
                >

                <button
                    type="button"
                    data-aplicar="nome"
                >
                    Aplicar a todos
                </button>

            </div>


            <div class="lote-campo-massa">

                <label>
                    Preço para todos
                </label>

                <input
                    id="lote-preco-todos"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Opcional"
                >

                <button
                    type="button"
                    data-aplicar="preco"
                >
                    Aplicar a todos
                </button>

            </div>


            <div class="lote-campo-massa">

                <label>
                    Descrição para todos
                </label>

                <textarea
                    id="lote-descricao-todos"
                    rows="2"
                    placeholder="Opcional"
                ></textarea>

                <button
                    type="button"
                    data-aplicar="descricao"
                >
                    Aplicar a todos
                </button>

            </div>

        </div>


        <div id="lote-produtos"></div>


        <div class="lote-acoes">

            <button
                type="button"
                id="btn-cadastrar-lote"
            >
                Cadastrar lote
            </button>

            <p
                id="lote-status"
                role="status"
                aria-live="polite"
            ></p>

        </div>
    `;


    areaCadastroLote.appendChild(
        lote
    );


    const inputImagens =
        document.getElementById(
            "lote-imagens"
        );


    if (inputImagens) {

        inputImagens.addEventListener(
            "change",
            atualizarLotePorArquivos
        );

    }


    lote
        .querySelectorAll(
            "[data-aplicar]"
        )
        .forEach(
            botao => {

                botao.addEventListener(
                    "click",
                    () => {

                        aplicarValorEmTodos(
                            botao.dataset.aplicar
                        );

                    }
                );

            }
        );


    const btnCadastrarLote =
        document.getElementById(
            "btn-cadastrar-lote"
        );


    if (btnCadastrarLote) {

        btnCadastrarLote.addEventListener(
            "click",
            cadastrarProdutosEmLote
        );

    }


    atualizarSelectCategoriaLote();
}


// ==========================================
// ESTILOS DO CADASTRO EM LOTE
// ==========================================

function inserirEstilosCadastroEmLote() {

    if (
        document.getElementById(
            "cadastro-lote-style"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "cadastro-lote-style";


    style.textContent = `

        #area-cadastro-lote[hidden] {
            display: none !important;
        }

        #cadastro-lote {
            width: 100%;
        }

        .cadastro-lote-topo {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 22px;
        }

        .lote-kicker {
            margin: 0 0 6px;
            color: #a85a3e;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: .14em;
        }

        .cadastro-lote-topo h2 {
            margin: 0 0 7px;
            color: #492b25;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 25px;
            font-weight: 400;
        }

        .cadastro-lote-topo p {
            margin: 0;
            max-width: 560px;
            color: #7e6960;
            font-size: 12px;
            line-height: 1.55;
        }

        #lote-contador {
            flex: 0 0 auto;
            padding: 8px 12px;
            border: 1px solid #d8c9bb;
            border-radius: 999px;
            background: #fffdf9;
            color: #492b25;
            font-size: 11px;
            font-weight: 800;
            white-space: nowrap;
        }

        .lote-campo {
            margin-bottom: 18px;
        }

        .lote-campo > label {
            display: block;
            margin-bottom: 7px;
            color: #67453d;
            font-size: 11px;
            font-weight: 800;
        }

        .lote-campo select {
            width: 100%;
            min-height: 46px;
            padding: 11px 13px;
            border: 1px solid #d8c9bb;
            border-radius: 10px;
            background: #fffdf9;
            color: #4d3731;
            font: inherit;
            outline: none;
        }

        .lote-campo select:focus {
            border-color: #c6a35b;
            box-shadow:
                0 0 0 3px rgba(198,163,91,.12);
        }

        .lote-campo small {
            display: block;
            margin-top: 6px;
            color: #9e8c83;
            font-size: 10px;
        }

        .lote-explicacao {
            margin: 0 0 10px;
            color: #7e6960;
            font-size: 11px;
        }

        #lote-imagens {
            position: absolute;
            width: 1px;
            height: 1px;
            opacity: 0;
            pointer-events: none;
        }

        .lote-upload {
            min-height: 145px;
            padding: 25px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 7px;
            border: 1.5px dashed #cdb69e;
            border-radius: 13px;
            background: #fffdfa;
            text-align: center;
            cursor: pointer;
            transition:
                border-color .2s ease,
                background .2s ease,
                transform .2s ease,
                box-shadow .2s ease;
        }

        .lote-upload:hover {
            border-color: #c6a35b;
            background: #fffaf4;
            transform: translateY(-1px);
            box-shadow:
                0 10px 24px rgba(73,43,37,.06);
        }

        .lote-upload-titulo {
            color: #492b25;
            font-family: Georgia, "Times New Roman", serif;
            font-size: 19px;
        }

        .lote-upload-texto {
            color: #806b62;
            font-size: 11px;
        }

        .lote-upload-formatos {
            color: #aa978b;
            font-size: 9px;
        }

        .lote-aplicar-todos {
            display: grid;
            grid-template-columns:
                repeat(3, minmax(0,1fr));
            gap: 10px;
            margin-bottom: 18px;
            padding: 12px;
            border: 1px solid #dfd3c8;
            border-radius: 13px;
            background: #fffdfa;
        }

        .lote-campo-massa {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .lote-campo-massa label {
            color: #67453d;
            font-size: 10px;
            font-weight: 800;
        }

        .lote-campo-massa input,
        .lote-campo-massa textarea {
            width: 100%;
            padding: 9px 10px;
            border: 1px solid #dbcec2;
            border-radius: 8px;
            background: #fff;
            color: #4d3731;
            font: inherit;
            outline: none;
        }

        .lote-campo-massa textarea {
            min-height: 63px;
            resize: vertical;
        }

        .lote-campo-massa input:focus,
        .lote-campo-massa textarea:focus {
            border-color: #c6a35b;
            box-shadow:
                0 0 0 3px rgba(198,163,91,.09);
        }

        .lote-campo-massa button {
            min-height: 34px;
            border: 1px solid #d7c8bb;
            border-radius: 8px;
            background: #f0e8df;
            color: #492b25;
            font-size: 10px;
            font-weight: 800;
            cursor: pointer;
        }

        .lote-campo-massa button:hover {
            background: #e7dccf;
            border-color: #c6a35b;
        }

        #lote-produtos {
            display: grid;
            gap: 10px;
        }

        .lote-produto-item {
            display: grid;
            grid-template-columns:
                86px minmax(0,1fr);
            gap: 12px;
            padding: 10px;
            border: 1px solid #e0d5cb;
            border-radius: 12px;
            background: #fffefa;
        }

        .lote-produto-imagem {
            position: relative;
            width: 86px;
            min-width: 86px;
        }

        .lote-produto-imagem img {
            width: 86px;
            height: 86px;
            object-fit: cover;
            border: 1px solid #e8ddd3;
            border-radius: 9px;
            background: #f3ece4;
        }

        .btn-remover-lote {
            position: absolute;
            left: 50%;
            bottom: 6px;
            transform: translateX(-50%);
            min-height: 28px;
            padding: 0 10px;
            border: 1px solid rgba(163,63,57,.25);
            border-radius: 999px;
            background: rgba(255,255,255,.96);
            color: #a33f39;
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow:
                0 4px 10px rgba(43,30,25,.12);
            opacity: 0;
            visibility: hidden;
            transition:
                opacity .18s ease,
                visibility .18s ease,
                background .18s ease,
                color .18s ease,
                transform .18s ease;
        }

        .lote-produto-item:hover .btn-remover-lote,
        .btn-remover-lote:focus-visible {
            opacity: 1;
            visibility: visible;
        }

        .btn-remover-lote:hover {
            background: #a33f39;
            color: #fff;
            transform:
                translateX(-50%)
                translateY(-1px);
        }

        .lote-produto-campos {
            display: grid;
            grid-template-columns:
                minmax(0,1fr) 145px;
            gap: 8px;
        }

        .lote-produto-campo {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }

        .lote-produto-campo-full {
            grid-column: 1 / -1;
        }

        .lote-produto-campo label {
            color: #7e6960;
            font-size: 9px;
            font-weight: 800;
        }

        .lote-produto-campo input,
        .lote-produto-campo textarea {
            width: 100%;
            padding: 8px 9px;
            border: 1px solid #ddd0c5;
            border-radius: 8px;
            background: #fff;
            color: #4d3731;
            font: inherit;
            outline: none;
        }

        .lote-produto-campo textarea {
            min-height: 54px;
            resize: vertical;
        }

        .lote-produto-campo input:focus,
        .lote-produto-campo textarea:focus {
            border-color: #c6a35b;
            box-shadow:
                0 0 0 3px rgba(198,163,91,.09);
        }

        .lote-acoes {
            margin-top: 18px;
            padding-top: 16px;
            border-top: 1px solid #dfd3c8;
        }

        #btn-cadastrar-lote {
            width: 100%;
            min-height: 47px;
            border: 1px solid #a85a3e;
            border-radius: 11px;
            background: #a85a3e;
            color: #fff;
            font-size: 12px;
            font-weight: 800;
            cursor: pointer;
            transition:
                background .2s ease,
                transform .2s ease,
                box-shadow .2s ease;
        }

        #btn-cadastrar-lote:hover {
            background: #914b34;
            transform: translateY(-1px);
            box-shadow:
                0 9px 20px rgba(168,90,62,.17);
        }

        #btn-cadastrar-lote:disabled {
            opacity: .5;
            cursor: wait;
            transform: none;
            box-shadow: none;
        }

        #lote-status {
            min-height: 18px;
            margin: 10px 0 0;
            color: #7e6960;
            font-size: 11px;
            line-height: 1.45;
        }

        @media (max-width: 800px) {

            .lote-aplicar-todos {
                grid-template-columns: 1fr;
            }

            .lote-produto-campos {
                grid-template-columns: 1fr;
            }

            .lote-produto-campo-full {
                grid-column: auto;
            }
        }

        @media (max-width: 540px) {

            .cadastro-lote-topo {
                flex-direction: column;
            }

            .lote-produto-item {
                grid-template-columns: 1fr;
            }

            .lote-produto-imagem {
                width: 100%;
                min-width: 0;
            }

            .lote-produto-imagem img {
                width: 100%;
                height: 180px;
            }

            .btn-remover-lote {
                opacity: 1;
                visibility: visible;
                min-height: 32px;
                font-size: 10px;
            }
        }
    `;


    document.head.appendChild(
        style
    );
}


// ==========================================
// ATUALIZAR LOTE PELOS ARQUIVOS
// ==========================================

function atualizarLotePorArquivos() {

    const input =
        document.getElementById(
            "lote-imagens"
        );


    if (!input) {

        return;
    }


    const arquivos =
        Array.from(
            input.files || []
        );


    const imagensInvalidas =
        arquivos.filter(
            arquivo =>
                !arquivo.type.startsWith(
                    "image/"
                )
        );


    if (imagensInvalidas.length) {

        input.value =
            "";

        produtosEmLote =
            [];

        renderizarProdutosEmLote(
            []
        );

        atualizarStatusLote(
            "Todos os arquivos selecionados devem ser imagens."
        );

        return;
    }


    limparPreviewsDoLote();


    produtosEmLote =
        arquivos.map(
            (arquivo, indice) => ({

                arquivo,

                indice,

                nome:
                    arquivo.name.replace(
                        /\.[^.]+$/,
                        ""
                    ),

                preco:
                    "",

                descricao:
                    "",

                categoria:
                    ""

            })
        );


    renderizarProdutosEmLote(
        produtosEmLote
    );


    atualizarStatusLote(
        arquivos.length
            ? `${arquivos.length} ${
                arquivos.length === 1
                    ? "imagem selecionada."
                    : "imagens selecionadas."
            }`
            : ""
    );
}


// ==========================================
// REMOVER PRODUTO DO LOTE
// ==========================================

function removerProdutoDoLote(indice) {

    if (
        indice < 0 ||
        indice >= produtosEmLote.length
    ) {

        return;
    }


    const produtoRemovido =
        produtosEmLote[indice];


    // ======================================
    // REMOVER OBJETO DE PRÉVIA
    // ======================================

    try {

        if (
            produtoRemovido?.previewUrl
        ) {

            URL.revokeObjectURL(
                produtoRemovido.previewUrl
            );

        }

    } catch (_) {}


    // ======================================
    // REMOVER DO ARRAY
    // ======================================

    produtosEmLote.splice(
        indice,
        1
    );


    // ======================================
    // ATUALIZAR INPUT DE ARQUIVOS
    // ======================================

    const input =
        document.getElementById(
            "lote-imagens"
        );


    if (input) {

        try {

            const dataTransfer =
                new DataTransfer();


            produtosEmLote.forEach(
                produto => {

                    if (produto.arquivo) {

                        dataTransfer.items.add(
                            produto.arquivo
                        );

                    }

                }
            );


            input.files =
                dataTransfer.files;

        } catch (erro) {

            console.warn(
                "Não foi possível sincronizar o campo de arquivos:",
                erro
            );

        }

    }


    // ======================================
    // REINDEXAR
    // ======================================

    produtosEmLote =
        produtosEmLote.map(
            (produto, novoIndice) => ({

                ...produto,

                indice:
                    novoIndice

            })
        );


    // ======================================
    // RENDERIZAR NOVAMENTE
    // ======================================

    renderizarProdutosEmLote(
        produtosEmLote
    );


    // ======================================
    // ATUALIZAR CONTADOR / STATUS
    // ======================================

    if (
        produtosEmLote.length
    ) {

        atualizarStatusLote(
            `${produtosEmLote.length} ${
                produtosEmLote.length === 1
                    ? "produto"
                    : "produtos"
            } selecionados.`
        );

    } else {

        atualizarStatusLote(
            "Nenhum produto selecionado."
        );

    }

}


// ==========================================
// RENDERIZAR PRODUTOS DO LOTE
// ==========================================

function renderizarProdutosEmLote(
    produtos
) {

    const container =
        document.getElementById(
            "lote-produtos"
        );


    const contador =
        document.getElementById(
            "lote-contador"
        );


    if (
        !container ||
        !contador
    ) {

        return;
    }


    limparPreviewsDoLote();


    contador.textContent =
        `${produtos.length} ${
            produtos.length === 1
                ? "produto"
                : "produtos"
        }`;


    container.innerHTML =
        "";


    produtos.forEach(
        (produto, indice) => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "lote-produto-item";


            const imagemUrl =
                URL.createObjectURL(
                    produto.arquivo
                );


            // Guardar URL para controle
            produto.previewUrl =
                imagemUrl;


            item.innerHTML = `

                <div
                    class="lote-produto-imagem"
                >

                    <img
                        src="${imagemUrl}"
                        data-preview-url="${imagemUrl}"
                        alt="Prévia do produto ${
                            indice + 1
                        }"
                    >

                    <button
                        type="button"
                        class="btn-remover-lote"
                        data-remover-lote="${indice}"
                        aria-label="Remover produto ${
                            indice + 1
                        }"
                        title="Remover este produto"
                    >
                        Remover
                    </button>

                </div>


                <div
                    class="lote-produto-campos"
                >

                    <div
                        class="lote-produto-campo"
                    >

                        <label>
                            Nome
                        </label>

                        <input
                            type="text"
                            data-lote-indice="${indice}"
                            data-lote-campo="nome"
                            value="${escaparHTMLAdmin(
                                produto.nome
                            )}"
                            placeholder="Nome do produto"
                        >

                    </div>


                    <div
                        class="lote-produto-campo"
                    >

                        <label>
                            Preço
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            data-lote-indice="${indice}"
                            data-lote-campo="preco"
                            value="${escaparHTMLAdmin(
                                produto.preco
                            )}"
                            placeholder="0,00"
                        >

                    </div>


                    <div
                        class="
                            lote-produto-campo
                            lote-produto-campo-categoria
                        "
                    >

                        <label>
                            Categoria
                        </label>

                        <select
                            data-lote-indice="${indice}"
                            data-lote-campo="categoria"
                        >

                            ${montarOpcoesCategoriasLote(
                                "Usar categoria padrão"
                            )}

                        </select>

                    </div>


                    <div
                        class="
                            lote-produto-campo
                            lote-produto-campo-full
                        "
                    >

                        <label>
                            Descrição
                        </label>

                        <textarea
                            rows="2"
                            data-lote-indice="${indice}"
                            data-lote-campo="descricao"
                            placeholder="Descrição opcional"
                        >${escaparHTMLAdmin(
                            produto.descricao
                        )}</textarea>

                    </div>

                </div>
            `;


            // ==================================
            // RESTAURAR CATEGORIA
            // ==================================

            const selectCategoria =
                item.querySelector(
                    '[data-lote-campo="categoria"]'
                );


            if (selectCategoria) {

                selectCategoria.value =
                    produto.categoria || "";
            }


            // ==================================
            // BOTÃO REMOVER
            // ==================================

            const botaoRemover =
                item.querySelector(
                    "[data-remover-lote]"
                );


            if (botaoRemover) {

                botaoRemover.addEventListener(
                    "click",
                    () => {

                        removerProdutoDoLote(
                            Number(
                                botaoRemover.dataset
                                    .removerLote
                            )
                        );

                    }
                );

            }


            container.appendChild(
                item
            );

        }
    );


    // ======================================
    // EVENTOS DOS CAMPOS
    // ======================================

    container
        .querySelectorAll(
            "[data-lote-indice]"
        )
        .forEach(
            campo => {

                const atualizarProduto =
                    () => {

                        const indice =
                            Number(
                                campo.dataset
                                    .loteIndice
                            );


                        const nomeCampo =
                            campo.dataset
                                .loteCampo;


                        if (
                            !produtosEmLote[
                                indice
                            ]
                        ) {

                            return;
                        }


                        produtosEmLote[
                            indice
                        ][
                            nomeCampo
                        ] =
                            campo.value;

                    };


                campo.addEventListener(
                    "input",
                    atualizarProduto
                );


                campo.addEventListener(
                    "change",
                    atualizarProduto
                );

            }
        );

}


// ==========================================
// APLICAR VALOR A TODOS
// ==========================================

function aplicarValorEmTodos(
    campo
) {

    if (
        !produtosEmLote.length
    ) {

        atualizarStatusLote(
            "Selecione as imagens antes de aplicar os valores."
        );

        return;
    }


    const input =
        document.getElementById(
            campo === "categoria"
                ? "lote-categoria"
                : `lote-${campo}-todos`
        );


    if (!input) {

        return;
    }


    const valor =
        input.value;


    if (
        campo === "categoria" &&
        !valor.trim()
    ) {

        atualizarStatusLote(
            "Escolha uma categoria antes de aplicá-la a todos."
        );

        return;
    }


    produtosEmLote.forEach(
        produto => {

            produto[campo] =
                valor;

        }
    );


    renderizarProdutosEmLote(
        produtosEmLote
    );


    atualizarStatusLote(
        `${
            campo.charAt(0).toUpperCase() +
            campo.slice(1)
        } aplicado a todos os produtos.`
    );
}


// ==========================================
// CADASTRAR PRODUTOS EM LOTE
// ==========================================

async function cadastrarProdutosEmLote() {

    const categoriaPadrao =
        document.getElementById(
            "lote-categoria"
        )?.value?.trim() || "";


    if (!vitrineAtual?.id) {

        atualizarStatusLote(
            "Não foi possível identificar a vitrine."
        );

        return;
    }


    if (
        !produtosEmLote.length
    ) {

        atualizarStatusLote(
            "Selecione pelo menos uma imagem."
        );

        return;
    }


    const itensInvalidos =
        produtosEmLote.filter(
            produto => {

                const nome =
                    produto.nome.trim();


                const precoTexto =
                    String(
                        produto.preco
                    ).trim();


                const preco =
                    Number(
                        precoTexto
                    );


                const categoria =
                    String(
                        produto.categoria ||
                        categoriaPadrao
                    ).trim();


                return (
                    !nome ||
                    !precoTexto ||
                    Number.isNaN(preco) ||
                    preco < 0 ||
                    !categoria
                );

            }
        );


    if (
        itensInvalidos.length
    ) {

        atualizarStatusLote(
            "Preencha nome, preço e categoria em todos os produtos antes de cadastrar."
        );

        return;
    }


    const botao =
        document.getElementById(
            "btn-cadastrar-lote"
        );


    if (botao) {

        botao.disabled =
            true;

        botao.textContent =
            "Cadastrando...";
    }


    try {

        for (
            let i = 0;
            i < produtosEmLote.length;
            i++
        ) {

            const produto =
                produtosEmLote[i];


            atualizarStatusLote(
                `Processando ${
                    i + 1
                } de ${
                    produtosEmLote.length
                }: ${
                    produto.nome
                }`
            );


            const resultado =
                await enviarProdutoEmLote({
                    produto,

                    categoria:
                        String(
                            produto.categoria ||
                            categoriaPadrao
                        ).trim()
                });


            if (!resultado.ok) {

                throw new Error(
                    `Falha no produto "${produto.nome}": ${resultado.mensagem}`
                );
            }
        }


        const quantidade =
            produtosEmLote.length;


        produtosEmLote =
            [];


        limparCadastroLote();


        await carregarCategoriasAdmin();

        await carregarProdutos();


        atualizarStatusLote(
            "Lote concluído com sucesso."
        );


        mostrarMensagem(
            `${quantidade} produtos cadastrados com sucesso!`
        );


    } catch (erro) {

        console.error(
            "Erro no cadastro em lote:",
            erro
        );


        atualizarStatusLote(
            erro.message ||
            "Ocorreu um erro durante o cadastro em lote."
        );


    } finally {

        if (botao) {

            botao.disabled =
                false;

            botao.textContent =
                "Cadastrar lote";
        }

    }
}


// ==========================================
// ENVIAR PRODUTO DO LOTE
// ==========================================

async function enviarProdutoEmLote({
    produto,
    categoria
}) {

    let nomeArquivo =
        null;


    try {

        const imagemComprimida =
            await comprimirImagem(
                produto.arquivo,
                1000,
                0.8
            );


        nomeArquivo =
            criarNomeArquivo(
                imagemComprimida
            );


        if (!nomeArquivo) {

            return {
                ok: false,
                mensagem:
                    "Não foi possível preparar a imagem."
            };
        }


        const {
            data: arquivo,
            error: erroUpload
        } =
            await supabaseClient
                .storage
                .from("produtos")
                .upload(
                    nomeArquivo,
                    imagemComprimida,
                    {
                        contentType:
                            "image/jpeg",

                        upsert:
                            false
                    }
                );


        if (erroUpload) {

            console.error(
                "Erro no upload do lote:",
                erroUpload
            );


            return {
                ok: false,
                mensagem:
                    "Erro ao enviar a imagem."
            };
        }


        console.log(
            "Imagem enviada no lote:",
            arquivo
        );


        const imagemUrl =
            obterUrlPublica(
                nomeArquivo
            );


        if (!imagemUrl) {

            await removerImagem(
                nomeArquivo
            );


            return {
                ok: false,
                mensagem:
                    "Não foi possível gerar a URL da imagem."
            };
        }


        const {
            data: produtoCriado,
            error: erroProduto
        } =
            await supabaseClient
                .from("produtos")
                .insert({
                    nome:
                        produto.nome.trim(),

                    descricao:
                        produto.descricao.trim(),

                    preco:
                        Number(
                            produto.preco
                        ),

                    categoria,

                    imagem_url:
                        imagemUrl,

                    imagem_path:
                        nomeArquivo,

                    ativo:
                        true,

                    vitrine_id:
                        vitrineAtual.id
                })
                .select()
                .single();


        if (erroProduto) {

            console.error(
                "Erro ao salvar produto do lote:",
                erroProduto
            );


            await removerImagem(
                nomeArquivo
            );


            return {
                ok: false,
                mensagem:
                    "Erro ao salvar o produto no banco."
            };
        }


        console.log(
            "Produto do lote criado:",
            produtoCriado
        );


        return {
            ok: true
        };


    } catch (erro) {

        console.error(
            "Erro inesperado no produto do lote:",
            erro
        );


        if (nomeArquivo) {

            await removerImagem(
                nomeArquivo
            );
        }


        return {
            ok: false,
            mensagem:
                "Erro inesperado durante o processamento."
        };
    }
}


// ==========================================
// LIMPAR PRÉVIAS DO LOTE
// ==========================================

function limparPreviewsDoLote() {

    document
        .querySelectorAll(
            "#lote-produtos img[data-preview-url]"
        )
        .forEach(
            img => {

                try {

                    URL.revokeObjectURL(
                        img.dataset.previewUrl
                    );

                } catch (_) {}
            }
        );


    produtosEmLote.forEach(
        produto => {

            if (produto.previewUrl) {

                try {

                    URL.revokeObjectURL(
                        produto.previewUrl
                    );

                } catch (_) {}

                produto.previewUrl =
                    null;
            }
        }
    );
}


// ==========================================
// LIMPAR CADASTRO EM LOTE
// ==========================================

function limparCadastroLote() {

    limparPreviewsDoLote();


    produtosEmLote =
        [];


    const input =
        document.getElementById(
            "lote-imagens"
        );


    if (input) {

        input.value =
            "";
    }


    const categoria =
        document.getElementById(
            "lote-categoria"
        );


    if (categoria) {

        categoria.value =
            "";

        categoria.required =
            false;
    }


    const nomeTodos =
        document.getElementById(
            "lote-nome-todos"
        );


    if (nomeTodos) {

        nomeTodos.value =
            "";
    }


    const precoTodos =
        document.getElementById(
            "lote-preco-todos"
        );


    if (precoTodos) {

        precoTodos.value =
            "";
    }


    const descricaoTodos =
        document.getElementById(
            "lote-descricao-todos"
        );


    if (descricaoTodos) {

        descricaoTodos.value =
            "";
    }


    renderizarProdutosEmLote([]);


    atualizarStatusLote("");
}


// ==========================================
// ATUALIZAR STATUS DO LOTE
// ==========================================

function atualizarStatusLote(
    texto
) {

    const status =
        document.getElementById(
            "lote-status"
        );


    if (status) {

        status.textContent =
            texto;
    }
}


// ==========================================
// LIMPAR TODO O CADASTRO
// ==========================================

function limparTudo() {

    limparFormularioIndividual();

    limparCadastroLote();

    produtoEditando =
        null;
}


// ==========================================
// INICIALIZAÇÃO
// ==========================================

async function iniciarPainel() {

    const autenticado =
        await verificarLogin();


    if (!autenticado) {

        return;
    }


    const vitrineCarregada =
        await carregarVitrineAtual();


    if (!vitrineCarregada) {

        return;
    }


    inserirGerenciadorCategorias();

    inserirEstilosCadastroEmLote();

    inserirGerenciadorCadastroEmLote();

    configurarSelecaoTipoCadastro();


    // ======================================
    // ESTADO INICIAL
    // ======================================

    if (areaCadastro) {

        areaCadastro.hidden =
            true;
    }


    if (selecaoTipoCadastro) {

        selecaoTipoCadastro.hidden =
            false;
    }


    if (blocoCadastroIndividual) {

        blocoCadastroIndividual.hidden =
            true;
    }


    if (areaCadastroLote) {

        areaCadastroLote.hidden =
            true;
    }


    // ======================================
    // INDICADOR INICIAL
    // ======================================

    if (indicadorModoCadastroTitulo) {

        indicadorModoCadastroTitulo.textContent =
            "Produto";
    }


    if (indicadorModoCadastroTipo) {

        indicadorModoCadastroTipo.textContent =
            "INDIVIDUAL";
    }


    // ======================================
    // CARREGAR DADOS
    // ======================================

    await carregarCategoriasAdmin();

    await carregarProdutos();
}


// ==========================================
// EXECUTAR QUANDO DOM ESTIVER PRONTO
// ==========================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        iniciarPainel
    );

} else {

    iniciarPainel();
}
