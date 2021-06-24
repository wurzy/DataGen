<!LANGUAGE pt>
{
  ppd: [
    'repeat(1)': {
        geral: {
            numeroPPD: "",
            nomePPD: "1",
            mencaoResp: "",
            entSel: []
        },
        sistemasInfo: [
            {
                visto: '{{boolean()}}',
                numeroSI: '{{index(1)}}',
                nomeSI: 'si{{index(1)}}',
                identificacao: {
                    adminSistema: [ 'repeat(1,5)': '{{pt_entity()}}' ],
                    adminDados: [ 'repeat(1,5)': '{{pt_entity()}}' ],
                    propSistemaPublico: [ 'repeat(1,5)': '{{pt_entity()}}' ],
                    propSistemaPrivado: '{{pt_entity()}}',
                    propDados: [ 'repeat(1,5)': '{{pt_entity()}}' ],
                    localDadosPublico: [ 'repeat(1,5)': '{{pt_entity()}}' ],
                    localDadosPrivado: '{{pt_entity()}}',
                    userList: [ 'repeat(1,20)': '{{pt_entity()}}' ],
                    defResponsavel: '{{random("Sim", "Não")}}',
                    insourcing: '{{random("Sim", "Não")}}',
                    outsourcing: '{{random("Sim", "Não")}}',
                    notas: ""
                },
                avaliacao: {
                    descricao: '{{lorem(1,"paragraphs")}}',
                    tabelaDecomposicao: [],
                    selecionadosTabelaFL: [],
                    sistemasRelacionados: [],
                    checkedAti: '{{random("Ativo", "Semi-Ativo", "Inativo", "Abatido")}}',
                    checkedGrau: '{{random("1", "2", "3", "4", "5")}}',
                    checkedCriticidade: '{{random("Muito crítico", "Crítico", "Pouco crítico", "Não crítico")}}',
                    objetoPreservacao: ""
                },
                caracterizacao: {
                    dependenciaSoft: '{{integer(1,3)}}',
                    categoriaDados: '{{random("Dados tabulares", "Grafos", "Texto estruturado", "Folha de cálculo", "Multimédia", "Misto")}}',
                    modeloCres: '{{integer(1,4)}}',
                    dimensao: '{{integer(0,2000)}}',
                    crescimento: '{{integer(0,2000)}}',
                    localSistema: '{{random("Centralizado", "Descentralizado", "Mista")}}',
                    salaTec: '{{random("Sim", "Não")}}',
                    acessoSalaTec: '{{random("Sim", "Não")}}',
                    energiaRed: '{{random("Sim", "Não")}}',
                    energiaSoc: '{{random("Sim", "Não")}}',
                    alarme: '{{integer(1,4)}}',
                    climatizacao: '{{random("Sim", "Não")}}',
                    seguranca: '{{random("Sim", "Não", "Em Estudo")}}',
                    comunicacaoEx: '{{random("Sim", "Não")}}',
                    planoContingencia: '{{random("Sim", "Não", "Em Desenvolvimento")}}',
                    planoMudEvolucao: '{{random("Sim", "Não", "Em Desenvolvimento")}}',
                    privAcesso: '{{random("Sim", "Não")}}',
                    catSegDados: '{{random("Sim, para toda a informação do sistema", "Sim, para alguma informação do sistema", "Não")}}',
                    rotinaAuditoria: '{{random("Sim", "Não")}}',
                    logsRotinas: '{{random("Sim", "Não")}}',
                    integridadeInfo: '{{integer(1,4)}}',
                    armazenamento: '{{integer(1,4)}}',
                    replicacaoDados: '{{random("Sim", "Não")}}',
                    backupsRegular: '{{integer(1,4)}}',
                    modeloBackup: '{{random("Armazenamento", "Incremental", "Diferencial", "Misto", "Outro")}}',
                    qualidadeBackup: '{{integer(1,4)}}',
                    inventarioSoft: '{{random("Sim", "Não", "Em Construção")}}',
                    inventarioHard: '{{random("Sim", "Não", "Em Construção")}}',
                    documentacaoSis: '{{integer(1,4)}}',
                    documentacaoProc: '{{random("Sim, todos", "Sim, alguns", "Não")}}',
                    controlVersaoDProc: '{{random("Sim", "Não")}}',
                    contratoAtivos: '{{random("Sim", "Não", "N/A")}}',
                    planoRecuperacao: '{{random("Sim", "Não", "Em Planeamento")}}',
                    notas: ""
                },
                estrategia: {
                    utilizacaoOperacional: {
                        idMetodoPreservacao: "",
                        fundMetodoPreservacao: "",
                        lacunas: ""
                    },
                    utilizacaoMemoria: {
                        idMetodoPreservacao: "",
                        fundMetodoPreservacao: "",
                        lacunas: ""
                    }
                }
            }
        ],
        arvore: [
            {
                id: "1",
                name: "si1",
                titulo: "si1",
                children: []
            }
        ]
      }
    ]
}