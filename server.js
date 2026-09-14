import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const appUrl = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, "");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("ERRO: As configurações do Supabase não foram encontradas.");
    console.error("Verifique o arquivo .env");
    process.exit(1);
}

const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);

// Cliente administrativo: use somente no servidor.
// A SUPABASE_SERVICE_ROLE_KEY nunca deve ser exposta no navegador.
const supabaseAdmin = supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

app.use(cors());
app.use(express.json());

// As rotas da API devem ser processadas antes dos arquivos estáticos.
// Isso evita que um recurso em /public seja entregue no lugar de uma rota como /pacientes.



// =====================================================
// ROTA PRINCIPAL
// =====================================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});


// =====================================================
// TESTE DO BANCO
// =====================================================

app.get("/teste-banco", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("pacientes")
            .select("*")
            .limit(10);

        if (error) {

            console.error("Erro ao consultar pacientes:", error);

            return res.status(500).json({
                erro: "Erro ao consultar o banco",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Conexão com Supabase funcionando!",
            pacientes: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor"
        });
    }
});


// =====================================================
// CADASTRAR PACIENTE
// =====================================================

app.post("/pacientes", async (req, res) => {

    try {

        const {
            nome,
            cpf,
            telefone,
            email,
            data_nascimento,
            endereco,
            observacoes
        } = req.body;

        // ---------------------------------------------
        // VALIDAÇÃO
        // ---------------------------------------------

        if (!nome || !telefone) {

            return res.status(400).json({
                erro: "Nome e telefone são obrigatórios."
            });
        }

        // ---------------------------------------------
        // CADASTRAR NO SUPABASE
        // ---------------------------------------------

        const { data, error } = await supabase
            .from("pacientes")
            .insert([
                {
                    nome,
                    cpf,
                    telefone,
                    email,
                    data_nascimento,
                    endereco,
                    observacoes
                }
            ])
            .select()
            .single();

        if (error) {

            console.error("Erro ao cadastrar paciente:", error);

            return res.status(500).json({
                erro: "Não foi possível cadastrar o paciente.",
                detalhes: error.message
            });
        }

        // ---------------------------------------------
        // RESPOSTA
        // ---------------------------------------------

        res.status(201).json({
            mensagem: "Paciente cadastrado com sucesso!",
            paciente: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// LISTAR PACIENTES
// =====================================================

app.get("/pacientes", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("pacientes")
            .select("*")
            .eq("ativo", true)
            .order("nome", { ascending: true });

        if (error) {

            console.error("Erro ao listar pacientes:", error);

            return res.status(500).json({
                erro: "Não foi possível consultar os pacientes.",
                detalhes: error.message
            });
        }

        res.json({
            pacientes: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// BUSCAR PACIENTE POR ID
// =====================================================

app.get("/pacientes/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("pacientes")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {

            console.error("Erro ao buscar paciente:", error);

            return res.status(404).json({
                erro: "Paciente não encontrado."
            });
        }

        res.json({
            paciente: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// EDITAR PACIENTE
// =====================================================

app.put("/pacientes/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            cpf,
            telefone,
            email,
            data_nascimento,
            endereco,
            observacoes
        } = req.body;

        if (!nome || !telefone) {

            return res.status(400).json({
                erro: "Nome e telefone são obrigatórios."
            });
        }

        const { data, error } = await supabase
            .from("pacientes")
            .update({
                nome,
                cpf,
                telefone,
                email,
                data_nascimento,
                endereco,
                observacoes,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error("Erro ao editar paciente:", error);

            return res.status(500).json({
                erro: "Não foi possível editar o paciente.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Paciente atualizado com sucesso!",
            paciente: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// DESATIVAR PACIENTE
// =====================================================

app.delete("/pacientes/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("pacientes")
            .update({
                ativo: false,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error("Erro ao desativar paciente:", error);

            return res.status(500).json({
                erro: "Não foi possível desativar o paciente.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Paciente desativado com sucesso!",
            paciente: data
        });

    } catch (erro) {

        console.error("Erro interno:", erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});



// =====================================================
// CADASTRAR DENTISTA
// =====================================================

app.post("/dentistas", async (req, res) => {

    try {

        const {
            nome,
            cro,
            especialidade,
            telefone,
            email,
            observacoes
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                erro: "O nome do dentista é obrigatório."
            });
        }

        const { data, error } = await supabase
            .from("dentistas")
            .insert([
                {
                    nome,
                    cro,
                    especialidade,
                    telefone,
                    email,
                    observacoes
                }
            ])
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao cadastrar dentista:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível cadastrar o dentista.",
                detalhes: error.message
            });
        }

        res.status(201).json({
            mensagem: "Dentista cadastrado com sucesso!",
            dentista: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// LISTAR DENTISTAS
// =====================================================

app.get("/dentistas", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("dentistas")
            .select("*")
            .eq("ativo", true)
            .order("nome", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao listar dentistas:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível consultar os dentistas.",
                detalhes: error.message
            });
        }

        res.json({
            dentistas: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// BUSCAR DENTISTA
// =====================================================

app.get("/dentistas/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("dentistas")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {

            return res.status(404).json({
                erro: "Dentista não encontrado."
            });
        }

        res.json({
            dentista: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// EDITAR DENTISTA
// =====================================================

app.put("/dentistas/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            cro,
            especialidade,
            telefone,
            email,
            observacoes
        } = req.body;

        if (!nome) {

            return res.status(400).json({
                erro: "O nome do dentista é obrigatório."
            });
        }

        const { data, error } = await supabase
            .from("dentistas")
            .update({
                nome,
                cro,
                especialidade,
                telefone,
                email,
                observacoes,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao editar dentista:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível editar o dentista.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Dentista atualizado com sucesso!",
            dentista: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// DESATIVAR DENTISTA
// =====================================================

app.delete("/dentistas/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("dentistas")
            .update({
                ativo: false,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao desativar dentista:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível desativar o dentista.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Dentista desativado com sucesso!",
            dentista: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});



// =====================================================
// CADASTRAR PROCEDIMENTO
// =====================================================

app.post("/procedimentos", async (req, res) => {

    try {

        const {
            nome,
            descricao,
            valor,
            duracao_minutos
        } = req.body;

        if (!nome) {
            return res.status(400).json({
                erro: "O nome do procedimento é obrigatório."
            });
        }

        const valorNumerico = Number(valor);

        const duracaoNumerica = Number(duracao_minutos);

        if (isNaN(valorNumerico) || valorNumerico < 0) {
            return res.status(400).json({
                erro: "Informe um valor válido."
            });
        }

        if (
            isNaN(duracaoNumerica) ||
            duracaoNumerica <= 0
        ) {
            return res.status(400).json({
                erro: "Informe uma duração válida."
            });
        }

        const { data, error } = await supabase
            .from("procedimentos")
            .insert([
                {
                    nome,
                    descricao,
                    valor: valorNumerico,
                    duracao_minutos: duracaoNumerica
                }
            ])
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao cadastrar procedimento:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível cadastrar o procedimento.",
                detalhes: error.message
            });
        }

        res.status(201).json({
            mensagem: "Procedimento cadastrado com sucesso!",
            procedimento: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// LISTAR PROCEDIMENTOS
// =====================================================

app.get("/procedimentos", async (req, res) => {

    try {

        const { data, error } = await supabase
            .from("procedimentos")
            .select("*")
            .eq("ativo", true)
            .order("nome", {
                ascending: true
            });

        if (error) {

            console.error(
                "Erro ao listar procedimentos:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível consultar os procedimentos.",
                detalhes: error.message
            });
        }

        res.json({
            procedimentos: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// BUSCAR PROCEDIMENTO
// =====================================================

app.get("/procedimentos/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("procedimentos")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {

            return res.status(404).json({
                erro: "Procedimento não encontrado."
            });
        }

        res.json({
            procedimento: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// EDITAR PROCEDIMENTO
// =====================================================

app.put("/procedimentos/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const {
            nome,
            descricao,
            valor,
            duracao_minutos
        } = req.body;

        if (!nome) {

            return res.status(400).json({
                erro: "O nome do procedimento é obrigatório."
            });
        }

        const valorNumerico = Number(valor);

        const duracaoNumerica = Number(duracao_minutos);

        if (isNaN(valorNumerico) || valorNumerico < 0) {

            return res.status(400).json({
                erro: "Informe um valor válido."
            });
        }

        if (
            isNaN(duracaoNumerica) ||
            duracaoNumerica <= 0
        ) {

            return res.status(400).json({
                erro: "Informe uma duração válida."
            });
        }

        const { data, error } = await supabase
            .from("procedimentos")
            .update({
                nome,
                descricao,
                valor: valorNumerico,
                duracao_minutos: duracaoNumerica,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao editar procedimento:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível editar o procedimento.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Procedimento atualizado com sucesso!",
            procedimento: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// DESATIVAR PROCEDIMENTO
// =====================================================

app.delete("/procedimentos/:id", async (req, res) => {

    try {

        const { id } = req.params;

        const { data, error } = await supabase
            .from("procedimentos")
            .update({
                ativo: false,
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {

            console.error(
                "Erro ao desativar procedimento:",
                error
            );

            return res.status(500).json({
                erro: "Não foi possível desativar o procedimento.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Procedimento desativado com sucesso!",
            procedimento: data
        });

    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// CONVERTER DATA/HORA DA CLÍNICA - BRASIL
// =====================================================

function converterDataHoraBrasil(dataHora) {

    const valor = String(dataHora || "").trim();

    // datetime-local enviado pelo navegador:
    // 2026-09-08T08:00
    //
    // Interpretamos explicitamente como horário de Brasília (UTC-3)
    if (
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)
    ) {
        return new Date(
            `${valor}:00-03:00`
        );
    }

    // Caso já venha com fuso/ISO completo
    return new Date(valor);
}







// =====================================================
// CADASTRAR AGENDAMENTO
// =====================================================

app.post("/agendamentos", async (req, res) => {

    try {

        const {
            paciente_id,
            dentista_id,
            procedimento_id,
            data_hora,
            duracao_minutos,
            observacoes
        } = req.body;


        // ---------------------------------------------
        // VALIDAÇÕES
        // ---------------------------------------------

        if (
            !paciente_id ||
            !dentista_id ||
            !procedimento_id ||
            !data_hora
        ) {

            return res.status(400).json({
                erro:
                    "Paciente, dentista, procedimento e data/horário são obrigatórios."
            });
        }


        const dataAgendamento =
    converterDataHoraBrasil(data_hora);

if (isNaN(dataAgendamento.getTime())) {
    return res.status(400).json({
        erro: "Data e horário inválidos."
    });
}

        const duracaoNumerica = Number(duracao_minutos);

        if (!Number.isFinite(duracaoNumerica) || duracaoNumerica <= 0) {
            return res.status(400).json({
                erro: "Informe uma duração válida para o atendimento."
            });
        }


        // ---------------------------------------------
        // BUSCAR PROCEDIMENTO
        // ---------------------------------------------

        const {
            data: procedimento,
            error: erroProcedimento
        } = await supabase
            .from("procedimentos")
            .select("*")
            .eq("id", procedimento_id)
            .eq("ativo", true)
            .single();


        if (erroProcedimento || !procedimento) {

            return res.status(400).json({
                erro: "Procedimento não encontrado."
            });
        }


        // ---------------------------------------------
        // VERIFICAR PACIENTE
        // ---------------------------------------------

        const {
            data: paciente,
            error: erroPaciente
        } = await supabase
            .from("pacientes")
            .select("id, nome")
            .eq("id", paciente_id)
            .eq("ativo", true)
            .single();


        if (erroPaciente || !paciente) {

            return res.status(400).json({
                erro: "Paciente não encontrado."
            });
        }


        // ---------------------------------------------
        // VERIFICAR DENTISTA
        // ---------------------------------------------

        const {
            data: dentista,
            error: erroDentista
        } = await supabase
            .from("dentistas")
            .select("id, nome")
            .eq("id", dentista_id)
            .eq("ativo", true)
            .single();


        if (erroDentista || !dentista) {

            return res.status(400).json({
                erro: "Dentista não encontrado."
            });
        }


        // ---------------------------------------------
        // CALCULAR HORÁRIO DE TÉRMINO
        // ---------------------------------------------

        const inicio = dataAgendamento;

        const fim = new Date(
            inicio.getTime() +
            duracaoNumerica * 60 * 1000
        );


        // ---------------------------------------------
        // BUSCAR AGENDAMENTOS DO DENTISTA
        // ---------------------------------------------

        const inicioDia =
            new Date(inicio);

        inicioDia.setHours(
            0,
            0,
            0,
            0
        );


        const fimDia =
            new Date(inicioDia);

        fimDia.setDate(
            fimDia.getDate() + 1
        );


        const {
            data: agendamentosExistentes,
            error: erroBusca
        } = await supabase
            .from("agendamentos")
            .select(`
                id,
                data_hora,
                status,
                valor,
                procedimento_id,
                duracao_minutos
            `)
            .eq("dentista_id", dentista_id)
            .gte(
                "data_hora",
                inicioDia.toISOString()
            )
            .lt(
                "data_hora",
                fimDia.toISOString()
            )
            .neq(
                "status",
                "cancelado"
            );


        if (erroBusca) {

            console.error(
                "Erro ao verificar horários:",
                erroBusca
            );

            return res.status(500).json({
                erro:
                    "Não foi possível verificar os horários disponíveis."
            });
        }


        // ---------------------------------------------
        // VERIFICAR CONFLITO
        // ---------------------------------------------

        for (
            const agendamento of agendamentosExistentes
        ) {

            const inicioExistente =
                new Date(
                    agendamento.data_hora
                );


            let duracaoExistente = Number(agendamento.duracao_minutos) || 0;


            const {
                data: procedimentoExistente
            } = await supabase
                .from("procedimentos")
                .select("duracao_minutos")
                .eq(
                    "id",
                    agendamento.procedimento_id
                )
                .single();


            if (
                !duracaoExistente &&
                procedimentoExistente &&
                procedimentoExistente.duracao_minutos
            ) {

                duracaoExistente =
                    procedimentoExistente.duracao_minutos;
            }

            if (!duracaoExistente) {
                duracaoExistente = 30;
            }


            const fimExistente =
                new Date(
                    inicioExistente.getTime() +
                    duracaoExistente *
                    60 *
                    1000
                );


            const existeConflito =
                inicio < fimExistente &&
                fim > inicioExistente;


            if (existeConflito) {

                return res.status(409).json({
                    erro:
                        "Este horário já está ocupado para este dentista."
                });
            }
        }


        // ---------------------------------------------
        // CRIAR AGENDAMENTO
        // ---------------------------------------------

        const {
            data,
            error
        } = await supabase
            .from("agendamentos")
            .insert([
                {
                    paciente_id,
                    dentista_id,
                    procedimento_id,
                    data_hora:
                        dataAgendamento.toISOString(),
                    duracao_minutos: duracaoNumerica,
                    status: "agendado",
                    valor: procedimento.valor,
                    observacoes
                }
            ])
            .select(`
                *,
                pacientes (
                    nome,
                    telefone
                ),
                dentistas (
                    nome,
                    especialidade
                ),
                procedimentos (
                    nome,
                    valor,
                    duracao_minutos
                )
            `)
            .single();


        if (error) {

            console.error(
                "Erro ao criar agendamento:",
                error
            );

            return res.status(500).json({
                erro:
                    "Não foi possível criar o agendamento.",
                detalhes:
                    error.message
            });
        }


        // ---------------------------------------------
        // SUCESSO
        // ---------------------------------------------

        res.status(201).json({

            mensagem:
                "Agendamento criado com sucesso!",

            agendamento: data

        });


    } catch (erro) {

        console.error(
            "Erro interno:",
            erro
        );

        res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }

});


// =====================================================
// LISTAR AGENDAMENTOS
// =====================================================

app.get("/agendamentos", async (req, res) => {

    try {

        const {
            data_inicio,
            data_fim,
            dentista_id
        } = req.query;


        let consulta = supabase
            .from("agendamentos")
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome,
                    especialidade
                ),
                procedimentos (
                    id,
                    nome,
                    valor,
                    duracao_minutos
                )
            `)
            .order(
                "data_hora",
                {
                    ascending: true
                }
            );


        if (data_inicio) {

            consulta =
                consulta.gte(
                    "data_hora",
                    data_inicio
                );
        }


        if (data_fim) {

            consulta =
                consulta.lt(
                    "data_hora",
                    data_fim
                );
        }


        if (dentista_id) {

            consulta =
                consulta.eq(
                    "dentista_id",
                    dentista_id
                );
        }


        const {
            data,
            error
        } = await consulta;


        if (error) {

            console.error(
                "Erro ao listar agendamentos:",
                error
            );

            return res.status(500).json({
                erro:
                    "Não foi possível consultar os agendamentos.",
                detalhes:
                    error.message
            });
        }


        res.json({
            agendamentos: data
        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }

});


// =====================================================
// BUSCAR AGENDAMENTO
// =====================================================

app.get("/agendamentos/:id", async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const {
            data,
            error
        } = await supabase
            .from("agendamentos")
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome,
                    especialidade
                ),
                procedimentos (
                    id,
                    nome,
                    valor,
                    duracao_minutos
                )
            `)
            .eq("id", id)
            .single();


        if (error) {

            return res.status(404).json({
                erro:
                    "Agendamento não encontrado."
            });
        }


        res.json({
            agendamento: data
        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }

});


// =====================================================
// ALTERAR AGENDAMENTO
// =====================================================

app.put("/agendamentos/:id", async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const {
            paciente_id,
            dentista_id,
            procedimento_id,
            data_hora,
            status,
            observacoes
        } = req.body;


        const atualizacao = {};


        if (paciente_id) {

            atualizacao.paciente_id =
                paciente_id;
        }


        if (dentista_id) {

            atualizacao.dentista_id =
                dentista_id;
        }


        if (procedimento_id) {

            atualizacao.procedimento_id =
                procedimento_id;


            const {
                data: procedimento
            } = await supabase
                .from("procedimentos")
                .select("valor")
                .eq(
                    "id",
                    procedimento_id
                )
                .single();


            if (procedimento) {

                atualizacao.valor =
                    procedimento.valor;
            }
        }


        if (data_hora) {

            const data =
                new Date(data_hora);


            if (isNaN(data.getTime())) {

                return res.status(400).json({
                    erro:
                        "Data e horário inválidos."
                });
            }


            atualizacao.data_hora =
                data.toISOString();
        }


        if (status) {

            const statusPermitidos = [
                "agendado",
                "confirmado",
                "atendido",
                "cancelado",
                "faltou"
            ];


            if (
                !statusPermitidos.includes(status)
            ) {

                return res.status(400).json({
                    erro:
                        "Status inválido."
                });
            }


            atualizacao.status =
                status;
        }


        if (
            observacoes !== undefined
        ) {

            atualizacao.observacoes =
                observacoes;
        }


        atualizacao.updated_at =
            new Date().toISOString();


        const {
            data,
            error
        } = await supabase
            .from("agendamentos")
            .update(atualizacao)
            .eq("id", id)
            .select(`
                *,
                pacientes (
                    nome,
                    telefone
                ),
                dentistas (
                    nome
                ),
                procedimentos (
                    nome,
                    valor,
                    duracao_minutos
                )
            `)
            .single();


        if (error) {

            console.error(
                "Erro ao atualizar agendamento:",
                error
            );

            return res.status(500).json({
                erro:
                    "Não foi possível atualizar o agendamento.",
                detalhes:
                    error.message
            });
        }


        res.json({

            mensagem:
                "Agendamento atualizado com sucesso!",

            agendamento:
                data

        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }

});


// =====================================================
// CANCELAR AGENDAMENTO
// =====================================================

app.delete("/agendamentos/:id", async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const {
            data,
            error
        } = await supabase
            .from("agendamentos")
            .update({
                status: "cancelado",
                updated_at:
                    new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();


        if (error) {

            console.error(
                "Erro ao cancelar agendamento:",
                error
            );

            return res.status(500).json({
                erro:
                    "Não foi possível cancelar o agendamento.",
                detalhes:
                    error.message
            });
        }


        res.json({

            mensagem:
                "Agendamento cancelado com sucesso!",

            agendamento:
                data

        });


    } catch (erro) {

        console.error(erro);

        res.status(500).json({
            erro:
                "Erro interno do servidor."
        });
    }

});




// =====================================================
// USUÁRIOS + SUPABASE AUTH — NOME + E-MAIL + PIN NUMÉRICO
// =====================================================

function validarEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validarPIN(pin) {
    return /^\d{4,12}$/.test(String(pin || ""));
}

const PERFIS_PERMITIDOS = [
    "administrador",
    "dentista",
    "recepcao"
];

function normalizarPerfil(perfil) {
    const valor = String(perfil || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    return PERFIS_PERMITIDOS.includes(valor) ? valor : "";
}

function validarPerfil(perfil) {
    return Boolean(normalizarPerfil(perfil));
}

function exigirAdmin(res) {
    if (!supabaseAdmin) {
        res.status(500).json({
            erro: "A SUPABASE_SERVICE_ROLE_KEY não está configurada no arquivo .env."
        });
        return false;
    }
    return true;
}

async function sincronizarConfirmacoes(usuarios) {
    if (!supabaseAdmin || !Array.isArray(usuarios)) return usuarios || [];

    return Promise.all(
        usuarios.map(async (usuario) => {
            if (!usuario.auth_user_id) return usuario;

            try {
                const { data, error } = await supabaseAdmin.auth.admin.getUserById(
                    usuario.auth_user_id
                );

                if (!error && data?.user) {
                    const confirmado = Boolean(data.user.email_confirmed_at);

                    if (usuario.email_confirmado !== confirmado) {
                        await supabaseAdmin
                            .from("usuarios")
                            .update({
                                email_confirmado: confirmado,
                                atualizado_em: new Date().toISOString()
                            })
                            .eq("auth_user_id", usuario.auth_user_id);

                        usuario.email_confirmado = confirmado;
                    }
                }
            } catch (erro) {
                console.error("Erro ao sincronizar confirmação:", erro.message);
            }

            return usuario;
        })
    );
}

// =====================================================
// LISTAR USUÁRIOS
// =====================================================

app.get("/usuarios", async (req, res) => {
    try {
        // Usa todas as colunas para evitar erro quando a estrutura da
        // tabela variar (por exemplo: id/criado_em ou created_at).
        const { data, error } = await supabase
            .from("usuarios")
            .select("*")
            .order("nome", { ascending: true });

        if (error) {
            console.error("Erro ao listar usuários:", error);
            return res.status(500).json({
                erro: "Não foi possível carregar os usuários.",
                detalhes: error.message
            });
        }

        const usuarios = await sincronizarConfirmacoes(data || []);

        return res.json({ usuarios });

    } catch (erro) {
        console.error("Erro interno ao listar usuários:", erro);

        return res.status(500).json({
            erro: "Erro interno do servidor.",
            detalhes: erro.message
        });
    }
});

// =====================================================
// CADASTRAR USUÁRIO + ENVIAR E-MAIL DE CONFIRMAÇÃO
// =====================================================

app.post("/usuarios", async (req, res) => {
    try {
        if (!exigirAdmin(res)) return;

        const nome = String(req.body.nome || "").trim();
        const email = String(req.body.email || "").trim().toLowerCase();
        const perfil = normalizarPerfil(req.body.perfil);
        const pin = String(req.body.pin || "").trim();

        if (!nome) {
            return res.status(400).json({
                erro: "O nome é obrigatório."
            });
        }

        if (!validarEmail(email)) {
            return res.status(400).json({
                erro: "Informe um e-mail válido."
            });
        }

        if (!validarPerfil(perfil)) {
            return res.status(400).json({
                erro: "Perfil inválido. Use: Administrador, Dentista ou Recepção."
            });
        }

        if (!validarPIN(pin)) {
            return res.status(400).json({
                erro: "O PIN deve conter somente números, entre 4 e 12 dígitos."
            });
        }

        const { data: usuarioExistente, error: erroConsulta } = await supabaseAdmin
            .from("usuarios")
            .select("auth_user_id, email")
            .eq("email", email)
            .maybeSingle();

        if (erroConsulta) {
            console.error("Erro ao verificar usuário:", erroConsulta);
            return res.status(500).json({
                erro: "Não foi possível verificar o e-mail.",
                detalhes: erroConsulta.message
            });
        }

        if (usuarioExistente) {
            return res.status(409).json({
                erro: "Já existe um usuário cadastrado com este e-mail."
            });
        }

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: pin,
            options: {
                data: { nome },
                emailRedirectTo: `${appUrl}/login.html?confirmado=1`
            }
        });

        if (authError) {
            console.error("Erro no Supabase Auth:", authError);
            return res.status(400).json({
                erro: authError.message
            });
        }

        const authUserId = authData?.user?.id;

        if (!authUserId) {
            return res.status(500).json({
                erro: "O usuário de autenticação não foi criado."
            });
        }

        const { data: usuario, error: profileError } = await supabaseAdmin
            .from("usuarios")
            .insert([
                {
                    auth_user_id: authUserId,
                    nome,
                    email,
                    perfil,
                    ativo: true,
                    email_confirmado: Boolean(authData.user.email_confirmed_at)
                }
            ])
            .select("auth_user_id, nome, email, perfil, ativo, email_confirmado")
            .single();

        if (profileError) {
            console.error("Erro ao cadastrar perfil:", profileError);

            // Evita deixar um usuário do Auth sem perfil na tabela do sistema.
            await supabaseAdmin.auth.admin.deleteUser(authUserId);

            return res.status(500).json({
                erro: "A conta foi criada, mas o perfil não pôde ser salvo.",
                detalhes: profileError.message
            });
        }

        res.status(201).json({
            mensagem: "Usuário cadastrado. Enviamos um e-mail para confirmação da conta.",
            usuario,
            confirmacaoEnviada: true
        });

    } catch (erro) {
        console.error("Erro interno ao cadastrar usuário:", erro);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

// =====================================================
// LOGIN COM NOME DE USUÁRIO + PIN
// O e-mail continua sendo usado pelo Supabase Auth internamente.
// =====================================================

app.post("/auth/login", async (req, res) => {
    try {
        const nomeBusca = String(
            req.body.usuario || req.body.nomeUsuario || req.body.nome || ""
        ).trim();
        const pin = String(req.body.pin || "").trim();

        if (!nomeBusca || !validarPIN(pin)) {
            return res.status(400).json({
                erro: "Informe seu nome de usuário e um PIN numérico."
            });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({
                erro: "O serviço de autenticação do servidor não está configurado."
            });
        }

        // Localiza o cadastro pelo nome.
        // Limitamos a 2 para detectar nomes duplicados sem expor a lista completa.
        const { data: usuarios, error: consultaError } = await supabaseAdmin
            .from("usuarios")
            .select("auth_user_id, nome, email, perfil, ativo, email_confirmado")
            .ilike("nome", nomeBusca)
            .limit(2);

        if (consultaError) {
            console.error("Erro ao consultar usuário para login:", consultaError);
            return res.status(500).json({
                erro: "Não foi possível consultar o usuário.",
                detalhes: consultaError.message
            });
        }

        if (!usuarios || usuarios.length === 0) {
            return res.status(401).json({
                erro: "Usuário ou PIN inválido."
            });
        }

        if (usuarios.length > 1) {
            return res.status(409).json({
                erro: "Existem usuários com o mesmo nome. Diferencie os nomes cadastrados antes de entrar."
            });
        }

        const usuarioCadastro = usuarios[0];

        if (usuarioCadastro.ativo === false) {
            return res.status(403).json({
                erro: "Este usuário está inativo."
            });
        }

        if (!usuarioCadastro.email || !validarEmail(usuarioCadastro.email)) {
            return res.status(500).json({
                erro: "Este usuário não possui um e-mail válido cadastrado para autenticação."
            });
        }

        const { data, error } = await supabase.auth.signInWithPassword({
            email: usuarioCadastro.email,
            password: pin
        });

        if (error) {
            console.error("Falha no Supabase Auth:", error.message);
            return res.status(401).json({
                erro: "Usuário ou PIN inválido."
            });
        }

        if (data.user?.id && usuarioCadastro.auth_user_id && data.user.id !== usuarioCadastro.auth_user_id) {
            console.error("Inconsistência entre usuarios.auth_user_id e Supabase Auth.");
            return res.status(500).json({
                erro: "O cadastro do usuário está inconsistente com a autenticação."
            });
        }

        const usuario = {
            ...usuarioCadastro,
            email_confirmado: Boolean(data.user?.email_confirmed_at)
        };

        if (data.user?.email_confirmed_at && !usuarioCadastro.email_confirmado) {
            await supabaseAdmin
                .from("usuarios")
                .update({
                    email_confirmado: true,
                    atualizado_em: new Date().toISOString()
                })
                .eq("auth_user_id", usuarioCadastro.auth_user_id);
        }

        return res.json({
            mensagem: "Login realizado com sucesso!",
            usuario,
            session: data.session
        });

    } catch (erro) {
        console.error("Erro no login:", erro);
        return res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});


// =====================================================
// VERIFICAR USUÁRIO LOGADO
// =====================================================
app.get("/auth/me", async (req, res) => {
    try {
        const authorization = String(req.headers.authorization || "");

        if (!authorization.startsWith("Bearer ")) {
            return res.status(401).json({
                erro: "Acesso não autorizado."
            });
        }

        const accessToken = authorization.replace("Bearer ", "").trim();

        const {
            data: authData,
            error: authError
        } = await supabase.auth.getUser(accessToken);

        if (authError || !authData?.user) {
            return res.status(401).json({
                erro: "Sessão inválida ou expirada."
            });
        }

        const authUser = authData.user;

        // Fallback: o usuário autenticado não perde o acesso caso
        // haja algum problema temporário ao consultar o perfil.
        let usuario = {
            auth_user_id: authUser.id,
            nome:
                authUser.user_metadata?.nome ||
                authUser.user_metadata?.name ||
                authUser.email ||
                "Usuário",
            email: authUser.email || "",
            perfil: authUser.user_metadata?.perfil || "Usuário",
            ativo: true,
            email_confirmado: Boolean(authUser.email_confirmed_at)
        };

        if (supabaseAdmin) {
            const {
                data: perfilUsuario,
                error: usuarioError
            } = await supabaseAdmin
                .from("usuarios")
                .select("auth_user_id, nome, email, perfil, ativo, email_confirmado")
                .eq("auth_user_id", authUser.id)
                .maybeSingle();

            if (usuarioError) {
                console.error("Erro ao carregar perfil do usuário:", usuarioError);
            }

            if (perfilUsuario) {
                if (perfilUsuario.ativo === false) {
                    return res.status(403).json({
                        erro: "Este usuário está inativo."
                    });
                }

                usuario = perfilUsuario;

                const emailConfirmado = Boolean(authUser.email_confirmed_at);

                if (usuario.email_confirmado !== emailConfirmado) {
                    const { error: updateError } = await supabaseAdmin
                        .from("usuarios")
                        .update({
                            email_confirmado: emailConfirmado,
                            atualizado_em: new Date().toISOString()
                        })
                        .eq("auth_user_id", authUser.id);

                    if (!updateError) {
                        usuario.email_confirmado = emailConfirmado;
                    }
                }
            }
        }

        return res.json({
            autenticado: true,
            usuario
        });

    } catch (erro) {
        console.error("Erro ao verificar sessão:", erro);

        return res.status(500).json({
            erro: "Erro interno ao verificar a sessão."
        });
    }
});

// =====================================================
// ENVIAR E-MAIL PARA REDEFINIR O PIN
// =====================================================

app.post("/auth/esqueci-pin", async (req, res) => {
    try {
        const email = String(req.body.email || "").trim().toLowerCase();

        if (!validarEmail(email)) {
            return res.status(400).json({
                erro: "Informe um e-mail válido."
            });
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${appUrl}/resetar-pin.html`
        });

        if (error) {
            console.error("Erro ao enviar recuperação:", error);
            return res.status(400).json({
                erro: error.message
            });
        }

        // Resposta genérica para não expor se o e-mail existe ou não.
        res.json({
            mensagem: "Se o e-mail estiver cadastrado, você receberá um link para redefinir o PIN."
        });

    } catch (erro) {
        console.error("Erro ao solicitar redefinição:", erro);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

// =====================================================
// REDEFINIR PIN APÓS ABRIR O LINK DO E-MAIL
// O token de recuperação é validado pelo Supabase Auth.
// =====================================================

app.post("/auth/atualizar-pin", async (req, res) => {
    try {
        const accessToken = String(req.body.access_token || "").trim();
        const pin = String(req.body.pin || "").trim();

        if (!accessToken) {
            return res.status(400).json({
                erro: "Token de recuperação não informado."
            });
        }

        if (!validarPIN(pin)) {
            return res.status(400).json({
                erro: "O novo PIN deve conter somente números, entre 4 e 12 dígitos."
            });
        }

        const clienteRecuperacao = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        });

        const { error } = await clienteRecuperacao.auth.updateUser({
            password: pin
        });

        if (error) {
            console.error("Erro ao atualizar PIN:", error);
            return res.status(400).json({
                erro: error.message
            });
        }

        res.json({
            mensagem: "PIN atualizado com sucesso!"
        });

    } catch (erro) {
        console.error("Erro ao atualizar PIN:", erro);
        res.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

// =====================================================
// INICIAR SERVIDOR
// =====================================================


// =====================================================
// RETORNOS — CADASTRO, CONSULTA E ATUALIZAÇÃO
// =====================================================

// Listar retornos
app.get("/retornos", async (req, res) => {
    try {
        const { status, paciente_id } = req.query;

        let consulta = supabase
            .from("retornos")
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome
                )
            `)
            .order("data_retorno", { ascending: true })
            .order("horario", { ascending: true });

        if (status) {
            consulta = consulta.eq("status", status);
        }

        if (paciente_id) {
            consulta = consulta.eq("paciente_id", paciente_id);
        }

        const { data, error } = await consulta;

        if (error) {
            console.error("Erro ao listar retornos:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os retornos.",
                detalhes: error.message
            });
        }

        res.json({ retornos: data || [] });
    } catch (erro) {
        console.error("Erro interno ao listar retornos:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Listar retornos pendentes
app.get("/retornos/pendentes", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("retornos")
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome
                )
            `)
            .eq("status", "pendente")
            .order("data_retorno", { ascending: true })
            .order("horario", { ascending: true });

        if (error) {
            console.error("Erro ao listar retornos pendentes:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os retornos pendentes.",
                detalhes: error.message
            });
        }

        res.json({ retornos: data || [] });
    } catch (erro) {
        console.error("Erro interno ao listar retornos pendentes:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Cadastrar retorno
app.post("/retornos", async (req, res) => {
    try {
        const {
            paciente_id,
            dentista_id,
            data_retorno,
            horario,
            motivo,
            observacoes
        } = req.body;

        if (!paciente_id || !dentista_id || !data_retorno || !horario) {
            return res.status(400).json({
                erro: "Paciente, dentista, data e horário do retorno são obrigatórios."
            });
        }

        // Confere se o paciente está ativo.
        const { data: paciente, error: erroPaciente } = await supabase
            .from("pacientes")
            .select("id, nome, telefone")
            .eq("id", paciente_id)
            .eq("ativo", true)
            .single();

        if (erroPaciente || !paciente) {
            return res.status(400).json({ erro: "Paciente não encontrado ou inativo." });
        }

        // Confere se o dentista está ativo.
        const { data: dentista, error: erroDentista } = await supabase
            .from("dentistas")
            .select("id, nome")
            .eq("id", dentista_id)
            .eq("ativo", true)
            .single();

        if (erroDentista || !dentista) {
            return res.status(400).json({ erro: "Dentista não encontrado ou inativo." });
        }

        const retorno = {
            paciente_id,
            dentista_id,
            data_retorno,
            horario,
            motivo: motivo || null,
            observacoes: observacoes || null
        };

        const { data, error } = await supabase
            .from("retornos")
            .insert([retorno])
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome
                )
            `)
            .single();

        if (error) {
            console.error("Erro ao cadastrar retorno:", error);
            return res.status(500).json({
                erro: "Não foi possível salvar o retorno.",
                detalhes: error.message
            });
        }

        res.status(201).json({
            mensagem: "Retorno cadastrado com sucesso!",
            retorno: data
        });
    } catch (erro) {
        console.error("Erro interno ao cadastrar retorno:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Buscar retorno por ID
app.get("/retornos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("retornos")
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome
                )
            `)
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json({ erro: "Retorno não encontrado." });
        }

        res.json({ retorno: data });
    } catch (erro) {
        console.error("Erro ao buscar retorno:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Atualizar retorno
app.put("/retornos/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            paciente_id,
            dentista_id,
            data_retorno,
            horario,
            motivo,
            observacoes,
            status
        } = req.body;

        const atualizacao = {};

        if (paciente_id !== undefined) atualizacao.paciente_id = paciente_id;
        if (dentista_id !== undefined) atualizacao.dentista_id = dentista_id;
        if (data_retorno !== undefined) atualizacao.data_retorno = data_retorno;
        if (horario !== undefined) atualizacao.horario = horario;
        if (motivo !== undefined) atualizacao.motivo = motivo || null;
        if (observacoes !== undefined) atualizacao.observacoes = observacoes || null;

        if (status !== undefined) {
            const statusPermitidos = ["pendente", "realizado", "cancelado"];
            if (!statusPermitidos.includes(status)) {
                return res.status(400).json({ erro: "Status de retorno inválido." });
            }
            atualizacao.status = status;
        }

        atualizacao.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from("retornos")
            .update(atualizacao)
            .eq("id", id)
            .select(`
                *,
                pacientes (
                    id,
                    nome,
                    telefone
                ),
                dentistas (
                    id,
                    nome
                )
            `)
            .single();

        if (error) {
            console.error("Erro ao atualizar retorno:", error);
            return res.status(500).json({
                erro: "Não foi possível atualizar o retorno.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Retorno atualizado com sucesso!",
            retorno: data
        });
    } catch (erro) {
        console.error("Erro interno ao atualizar retorno:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Cancelar retorno
app.delete("/retornos/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("retornos")
            .update({
                status: "cancelado",
                updated_at: new Date().toISOString()
            })
            .eq("id", id)
            .select()
            .single();

        if (error) {
            console.error("Erro ao cancelar retorno:", error);
            return res.status(500).json({
                erro: "Não foi possível cancelar o retorno.",
                detalhes: error.message
            });
        }

        res.json({
            mensagem: "Retorno cancelado com sucesso!",
            retorno: data
        });
    } catch (erro) {
        console.error("Erro interno ao cancelar retorno:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});



// =====================================================
// FINANCEIRO — TRATAMENTOS E PAGAMENTOS LIVRES
// Não existe parcelamento fixo.
// Um tratamento possui um valor total e pode receber
// quantos pagamentos forem necessários, em qualquer valor,
// desde que o pagamento não ultrapasse o saldo.
// =====================================================

function numeroFinanceiro(valor) {
    const n = Number(valor);
    return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

function dataHojeISO() {
    return new Date().toISOString().slice(0, 10);
}

async function enriquecerTratamentosFinanceiros(tratamentos) {
    const lista = Array.isArray(tratamentos) ? tratamentos : [];

    if (!lista.length) return [];

    const idsTratamentos = lista.map(t => String(t.id));

    const { data: pagamentos, error: erroPagamentos } = await supabase
        .from("pagamentos_financeiros")
        .select("*")
        .in("tratamento_id", idsTratamentos)
        .order("data_pagamento", { ascending: true });

    if (erroPagamentos) {
        throw erroPagamentos;
    }

    const pagamentosPorTratamento = {};
    for (const pagamento of (pagamentos || [])) {
        const chave = String(pagamento.tratamento_id);
        if (!pagamentosPorTratamento[chave]) {
            pagamentosPorTratamento[chave] = [];
        }
        pagamentosPorTratamento[chave].push(pagamento);
    }

    const pacienteIds = [...new Set(lista.map(t => t.paciente_id).filter(Boolean).map(String))];
    const dentistaIds = [...new Set(lista.map(t => t.dentista_id).filter(Boolean).map(String))];
    const procedimentoIds = [...new Set(lista.map(t => t.procedimento_id).filter(Boolean).map(String))];

    const buscarPorIds = async (tabela, ids, campos = "*") => {
        if (!ids.length) return [];
        const { data, error } = await supabase
            .from(tabela)
            .select(campos)
            .in("id", ids);
        if (error) throw error;
        return data || [];
    };

    const [pacientes, dentistas, procedimentos] = await Promise.all([
        buscarPorIds("pacientes", pacienteIds, "id,nome,cpf,telefone"),
        buscarPorIds("dentistas", dentistaIds, "id,nome,especialidade"),
        buscarPorIds("procedimentos", procedimentoIds, "id,nome,valor,duracao_minutos")
    ]);

    const mapa = (itens) => Object.fromEntries((itens || []).map(item => [String(item.id), item]));
    const mapaPacientes = mapa(pacientes);
    const mapaDentistas = mapa(dentistas);
    const mapaProcedimentos = mapa(procedimentos);

    return lista.map(t => {
        const pagamentosTratamento = pagamentosPorTratamento[String(t.id)] || [];
        const totalPago = pagamentosTratamento.reduce(
            (soma, p) => soma + Number(p.valor || 0),
            0
        );

        const valorTotal = Number(t.valor_total || 0);
        const saldo = Math.max(0, valorTotal - totalPago);
        const statusCalculado = saldo <= 0.005 ? "quitado" : "em_andamento";

        return {
            ...t,
            valor_total: valorTotal,
            total_pago: Math.round(totalPago * 100) / 100,
            saldo_devedor: Math.round(saldo * 100) / 100,
            percentual_pago: valorTotal > 0
                ? Math.min(100, Math.round((totalPago / valorTotal) * 10000) / 100)
                : 0,
            status: statusCalculado,
            paciente: mapaPacientes[String(t.paciente_id)] || null,
            dentista: mapaDentistas[String(t.dentista_id)] || null,
            procedimento: mapaProcedimentos[String(t.procedimento_id)] || null,
            pagamentos: pagamentosTratamento
        };
    });
}


// -----------------------------------------------------
// LISTAR TRATAMENTOS FINANCEIROS
// -----------------------------------------------------

app.get("/tratamentos-financeiros", async (req, res) => {
    try {
        const {
            paciente_id,
            dentista_id,
            status,
            data_inicio,
            data_fim
        } = req.query;

        let consulta = supabase
            .from("tratamentos_financeiros")
            .select("*")
            .order("data_inicio", { ascending: false })
            .order("created_at", { ascending: false });

        if (paciente_id) consulta = consulta.eq("paciente_id", paciente_id);
        if (dentista_id) consulta = consulta.eq("dentista_id", dentista_id);

        if (data_inicio) consulta = consulta.gte("data_inicio", data_inicio);
        if (data_fim) consulta = consulta.lte("data_inicio", data_fim);

        // Status é calculado pelo total pago, então o filtro é aplicado
        // depois do enriquecimento.
        const { data, error } = await consulta;

        if (error) {
            console.error("Erro ao listar tratamentos financeiros:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os tratamentos financeiros.",
                detalhes: error.message
            });
        }

        let tratamentos = await enriquecerTratamentosFinanceiros(data || []);

        if (status) {
            tratamentos = tratamentos.filter(t => t.status === status);
        }

        const resumo = tratamentos.reduce((acc, t) => {
            acc.total_tratamentos += 1;
            acc.valor_total += Number(t.valor_total || 0);
            acc.total_recebido += Number(t.total_pago || 0);
            acc.total_a_receber += Number(t.saldo_devedor || 0);
            if (t.status === "quitado") acc.quitados += 1;
            else acc.em_andamento += 1;
            return acc;
        }, {
            total_tratamentos: 0,
            valor_total: 0,
            total_recebido: 0,
            total_a_receber: 0,
            quitados: 0,
            em_andamento: 0
        });

        for (const chave of ["valor_total", "total_recebido", "total_a_receber"]) {
            resumo[chave] = Math.round(resumo[chave] * 100) / 100;
        }

        res.json({
            tratamentos,
            resumo
        });
    } catch (erro) {
        console.error("Erro interno ao listar tratamentos financeiros:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// -----------------------------------------------------
// CADASTRAR TRATAMENTO FINANCEIRO
// -----------------------------------------------------

app.post("/tratamentos-financeiros", async (req, res) => {
    try {
        const {
            paciente_id,
            dentista_id,
            procedimento_id,
            valor_total,
            data_inicio,
            observacoes
        } = req.body;

        if (!paciente_id || !dentista_id || !procedimento_id) {
            return res.status(400).json({
                erro: "Paciente, dentista e procedimento são obrigatórios."
            });
        }

        const valor = numeroFinanceiro(valor_total);

        if (!Number.isFinite(valor) || valor <= 0) {
            return res.status(400).json({
                erro: "Informe um valor total maior que zero."
            });
        }

        const dataTratamento = data_inicio || dataHojeISO();

        const { data, error } = await supabase
            .from("tratamentos_financeiros")
            .insert([{
                paciente_id: String(paciente_id),
                dentista_id: String(dentista_id),
                procedimento_id: String(procedimento_id),
                valor_total: valor,
                data_inicio: dataTratamento,
                status: "em_andamento",
                observacoes: observacoes || null
            }])
            .select()
            .single();

        if (error) {
            console.error("Erro ao cadastrar tratamento financeiro:", error);
            return res.status(500).json({
                erro: "Não foi possível cadastrar o tratamento.",
                detalhes: error.message
            });
        }

        const [tratamentoCompleto] = await enriquecerTratamentosFinanceiros([data]);

        res.status(201).json({
            mensagem: "Tratamento cadastrado com sucesso!",
            tratamento: tratamentoCompleto
        });
    } catch (erro) {
        console.error("Erro interno ao cadastrar tratamento financeiro:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// -----------------------------------------------------
// DETALHAR TRATAMENTO FINANCEIRO
// -----------------------------------------------------

app.get("/tratamentos-financeiros/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("tratamentos_financeiros")
            .select("*")
            .eq("id", id)
            .single();

        if (error || !data) {
            return res.status(404).json({
                erro: "Tratamento financeiro não encontrado."
            });
        }

        const [tratamento] = await enriquecerTratamentosFinanceiros([data]);

        res.json({ tratamento });
    } catch (erro) {
        console.error("Erro ao consultar tratamento financeiro:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// -----------------------------------------------------
// REGISTRAR PAGAMENTO LIVRE
// -----------------------------------------------------

app.post("/tratamentos-financeiros/:id/pagamentos", async (req, res) => {
    try {
        const { id } = req.params;
        const {
            valor,
            data_pagamento,
            observacoes
        } = req.body;

        const valorPagamento = numeroFinanceiro(valor);

        if (!Number.isFinite(valorPagamento) || valorPagamento <= 0) {
            return res.status(400).json({
                erro: "Informe um valor de pagamento maior que zero."
            });
        }

        const { data: tratamento, error: erroTratamento } = await supabase
            .from("tratamentos_financeiros")
            .select("*")
            .eq("id", id)
            .single();

        if (erroTratamento || !tratamento) {
            return res.status(404).json({
                erro: "Tratamento financeiro não encontrado."
            });
        }

        const { data: pagamentosAtuais, error: erroPagamentos } = await supabase
            .from("pagamentos_financeiros")
            .select("id,valor")
            .eq("tratamento_id", String(id));

        if (erroPagamentos) {
            console.error("Erro ao consultar pagamentos:", erroPagamentos);
            return res.status(500).json({
                erro: "Não foi possível verificar o saldo do tratamento.",
                detalhes: erroPagamentos.message
            });
        }

        const totalPago = (pagamentosAtuais || []).reduce(
            (soma, p) => soma + Number(p.valor || 0),
            0
        );

        const saldo = Math.max(0, Number(tratamento.valor_total || 0) - totalPago);

        if (saldo <= 0.005) {
            return res.status(400).json({
                erro: "Este tratamento já está quitado.",
                saldo_devedor: 0
            });
        }

        if (valorPagamento > saldo + 0.005) {
            return res.status(400).json({
                erro: `O pagamento não pode ultrapassar o saldo de R$ ${saldo.toFixed(2).replace(".", ",")}.`,
                saldo_devedor: Math.round(saldo * 100) / 100
            });
        }

        const { data: pagamento, error: erroInsercao } = await supabase
            .from("pagamentos_financeiros")
            .insert([{
                tratamento_id: String(id),
                valor: valorPagamento,
                data_pagamento: data_pagamento || dataHojeISO(),
                observacoes: observacoes || null
            }])
            .select()
            .single();

        if (erroInsercao) {
            console.error("Erro ao registrar pagamento:", erroInsercao);
            return res.status(500).json({
                erro: "Não foi possível registrar o pagamento.",
                detalhes: erroInsercao.message
            });
        }

        const novoTotalPago = totalPago + valorPagamento;
        const novoSaldo = Math.max(
            0,
            Number(tratamento.valor_total || 0) - novoTotalPago
        );
        const novoStatus = novoSaldo <= 0.005 ? "quitado" : "em_andamento";

        const { error: erroStatus } = await supabase
            .from("tratamentos_financeiros")
            .update({
                status: novoStatus,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);

        if (erroStatus) {
            console.error("Erro ao atualizar status do tratamento:", erroStatus);
        }

        const { data: tratamentoAtualizado, error: erroBuscaFinal } = await supabase
            .from("tratamentos_financeiros")
            .select("*")
            .eq("id", id)
            .single();

        if (erroBuscaFinal) {
            return res.status(201).json({
                mensagem: "Pagamento registrado com sucesso!",
                pagamento
            });
        }

        const [completo] = await enriquecerTratamentosFinanceiros([tratamentoAtualizado]);

        res.status(201).json({
            mensagem: novoStatus === "quitado"
                ? "Pagamento registrado. Tratamento quitado!"
                : "Pagamento registrado com sucesso!",
            pagamento,
            tratamento: completo
        });
    } catch (erro) {
        console.error("Erro interno ao registrar pagamento:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// -----------------------------------------------------
// LISTAR PAGAMENTOS DE UM TRATAMENTO
// -----------------------------------------------------

app.get("/tratamentos-financeiros/:id/pagamentos", async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from("pagamentos_financeiros")
            .select("*")
            .eq("tratamento_id", String(id))
            .order("data_pagamento", { ascending: false })
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Erro ao listar pagamentos:", error);
            return res.status(500).json({
                erro: "Não foi possível consultar os pagamentos.",
                detalhes: error.message
            });
        }

        res.json({ pagamentos: data || [] });
    } catch (erro) {
        console.error("Erro interno ao listar pagamentos:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// -----------------------------------------------------
// RESUMO FINANCEIRO POR PERÍODO
// -----------------------------------------------------

app.get("/financeiro/resumo", async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let consultaTratamentos = supabase
            .from("tratamentos_financeiros")
            .select("*");

        if (data_inicio) consultaTratamentos = consultaTratamentos.gte("data_inicio", data_inicio);
        if (data_fim) consultaTratamentos = consultaTratamentos.lte("data_inicio", data_fim);

        const { data: tratamentos, error } = await consultaTratamentos;

        if (error) {
            return res.status(500).json({
                erro: "Não foi possível gerar o resumo financeiro.",
                detalhes: error.message
            });
        }

        const lista = await enriquecerTratamentosFinanceiros(tratamentos || []);

        const resumo = lista.reduce((acc, t) => {
            acc.tratamentos += 1;
            acc.valor_total += Number(t.valor_total || 0);
            acc.recebido += Number(t.total_pago || 0);
            acc.a_receber += Number(t.saldo_devedor || 0);
            return acc;
        }, {
            tratamentos: 0,
            valor_total: 0,
            recebido: 0,
            a_receber: 0
        });

        resumo.valor_total = Math.round(resumo.valor_total * 100) / 100;
        resumo.recebido = Math.round(resumo.recebido * 100) / 100;
        resumo.a_receber = Math.round(resumo.a_receber * 100) / 100;

        res.json({ resumo, tratamentos: lista });
    } catch (erro) {
        console.error("Erro interno no resumo financeiro:", erro);
        res.status(500).json({ erro: "Erro interno do servidor." });
    }
});


// Arquivos estáticos por último: a API tem prioridade sobre /public.
app.use(express.static("public"));


app.listen(PORT, () => {

    console.log("");
    console.log("======================================");
    console.log(" CLÍNICA ODONTOLÓGICA");
    console.log("======================================");
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log(`Teste banco: http://localhost:${PORT}/teste-banco`);
    console.log(`Pacientes: http://localhost:${PORT}/pacientes`);
    console.log("======================================");
    console.log("");

});