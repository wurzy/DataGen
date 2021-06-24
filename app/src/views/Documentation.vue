<template>
  <div class="container" style="text-align: justify; text-justify: inter-word;">
    <br/>
    <h2>Documentação</h2>
    <hr/>
    <div>
        <h4>Definição da DSL <i>(Domain Specific Language)</i></h4>
        <p>A DSL é definida por pares de chave-valor agrupados dentro de um bloco iniciado pela diretiva <code>repeat</code>, envolta de parêntesis retos.</p>
        <p>Esta definição é importante para o utilizador final, uma vez que a sintaxe é muito semelhante a outras linguagens de programação e, portanto, permite uma melhor compreensão da gramática.</p>
        <p>É possível, também, existirem objetos aninhados. Assim, permite tipar arbritrariamente <i>arrays</i> de objetos para o <i>dataset</i> final.</p>
    </div>

    <hr/>

    <div>
        <h4>Definição de Pares Chave-Valor</h4>
        <p>Um par chave-valor é composto por dois elementos separadas por dois pontos (<b>:</b>).</p> 
        <p>A chave não pode conter espaços brancos (exceto entre o último caractere da <i>String</i> e o separador) nem qualquer outro caractere que não percença ao alfabeto ou que não seja um <i>underscore</i>.</p>
        <p>Por exemplo, <code>lorem_ipsum</code> é uma chave válida enquanto <code>lorem ipsum</code>, <code>lorem:ipsum</code> ou <code>lorem-ipsum</code> não são.</p>
        <p>A única exceção é a diretiva <code>repeat</code>, que está entre plicas e que recebe como argumento um inteiro. Esta é responsável por gerar um <i>array</i> de objetos cujo comprimento é o dado por argumento.</p>
        <p>Os valores podem ser um dos seguintes:</p>
        <ul>
            <li>Número</li>
            <li><i>String</i></li>
            <li><i>Array</i></li>
            <li>Booleano</li>
            <li>null</li>
            <li>Objeto DSL</li>
            <li>Função "Moustache" (a ver mais à frente)</li>
        </ul>
    </div>

    <hr/>
    <div>
        <h4>Funções "Moustache"</h4>
        
        <p>A utilidade destas funções é automatizar diretivas para o utilizador, de modo a ter um maior leque de <i>datasets</i> possíveis.</p>
        <p>Têm de ser escritas envoltas de duas chavetas no par chave-valor pretendido, assim como plicas a englobar toda a estrutura. Por exemplo, 
        <code v-html="'\'{{integer()}}\''"></code> é uma função "Moustache" válida.</p>

        <p>A seguir a qualquer "moustache", pode-se colocar <code v-html="'.string()'"></code> para converter o resultado em <i>String</i>, p.e. <code v-html="'\'{{boolean()}}\''"></code> = false mas <code v-html="'\'{{boolean()}}\'. string()'"></code> = "false".</p>
        <p>Qualquer interpolação também pode ser encapsulada por <code v-html="'unique()'"></code>, p.e. <code v-html="'unique(\'{{continent()}}\')'"></code>, para garantir resultados únicos.</p>
        <ul>
            <li> Se a interpolação tiver apenas um "moustache" dentro, que seja um random ou um correspondente  a um dos <i>datasets</i> de suporte, e o número do repeat for inferior ao número de valores 
            diferentes possíveis para esse "moustache", é garantido que todos os valores são diferentes. Caso o número seja superior, dá erro. </li>
            <li> Caso tenha só um "moustache" e strings normais, garante que os valores gerados são únicos na mesma, p.e. <code v-html="'unique(\'Continente: {{continent()}}\')'">
            </code>. Se não for random ou "moustache" dos <i>datasets</i> de suporte, já não garante que os valores sejam todos diferentes. </li>
	        <li> Se a interpolação tiver mais que um "moustache" dentro, não garante que os valores são todos diferentes, p.e. <code v-html="'unique(\'{{continent()}} - {{country()}}\')'">
            </code>. </li>
        </ul>
        <p>Uma função "moustache" também pode chamar o valor de uma propriedade local como valor de um argumento. P.e., em <code v-html="'\'{{integer(this.x, this.y)}}\''"></code>
        são chamadas duas variáveis, definidas antes da função.</p>
        <p>De modo semelhante, valores de propriedades também podem ser utlizados diretamente na interpolação como <code v-html="'\'{{this.arr[2]}}\''"></code> ou 
        <code v-html="'\'{{this.x}}\''"></code>.</p>

        <p>A funções que recebem intervalos de valor funcionam tanto por ordem ascendente como descrescente. </p>
        <p>De seguida estão explícitas todas as que se encontram atualmente disponíveis.</p>
    </div>
    <div class="method">
        <div class="row margin-0 list-header hidden-sm hidden-xs">
            <div class="col-md-2"><div class="header">Moustache</div></div>
            <div class="col-md-2"><div class="header">Tipo</div></div>
            <div class="col-md-3"><div class="header">Argumento(s)</div></div>
            <div class="col-md-5"><div class="header">Descrição</div></div>
        </div>

        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        objectID 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um ID aleatório com 24 bytes. <br/>
                        Exemplo: "6048e87b9281fc9a1afe8e61"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        guid 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um UUID aleatório. <br/>
                        Exemplo: "3d16d5d0-4b11-4de8-9e26-6668b52d9219"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        index 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Integer</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Retorna o índice atual do objeto gerado pelo 'repeat'. <br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0"> 
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        boolean
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Boolean</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um booleano aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0"> 
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        firstName
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome próprio aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0"> 
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        surname
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um apelido aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0"> 
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        fullName
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome completo aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        integer 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Integer</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Min:: <code>Integer</code>,<br/>
                        Max:: <code>Integer</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um inteiro aleatório entre Min e Max. <br/>
                        Exemplo: integer(2,4) = 3
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        formattedInteger
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Min:: <code>Integer</code>,<br/>
                        Max:: <code>Integer</code>,<br/>
                        Pad:: <code>Integer</code>,<br/>
                        Unid:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um inteiro aleatório entre Min e Max, garante que tem pelo menos tantos algarismos quantos especificados no Pad e acrescenta uma <i>String</i> Unid no final. <br/>
                        Caso não queira padding, pode colocar um 0 no 3º argumento e caso não queira colocar a unidade, pode colocar um "" no último argumento.<br/>
                        Exemplo1: formattedInteger(2, 400, 3, "$") = "100$" <br/>
                        Exemplo2: formattedInteger(1, 3, 3, "") = "002"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        float
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Float</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Min:: <code>Float</code>,<br/>
                        Max:: <code>Float</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número decimal aleatório entre Min e Max. <br/>
                        O número de casas decimais do resultado vai ser igual ao do argumento com mais casas decimais. <br/>
                        Exemplo: float(-180.4, 180.29) = -19.10
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        float
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Float</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Min:: <code>Float</code>,<br/>
                        Max:: <code>Float</code>,<br/>
                        C:: <code>Integer</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número decimal aleatório entre Min e Max com um total de C casas decimais. <br/>
                        Caso o número gerado acabe com 0s à direita na parte decimal, estes são omitidos. <br/>
                        Exemplo: float(-180, 180, 2) = -19.11
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        formattedFloat
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Min:: <code>Integer</code>,<br/>
                        Max:: <code>Integer</code>,<br/>
                        C:: <code>Integer</code>,<br/>
                        Pad:: <code>Integer</code>,<br/>
                        Form:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número decimal aleatório entre Min e Max com um total de C casas decimais e garante que tem pelo menos tantos algarismos na parte inteira quantos especificados no Pad. <br/>
                        Por fim, recebe o formato no argumento Form o formato é "0#0#00?", onde o primeiro # é um caractere para separar cada 3 algarismos de inteiros, o segundo é para separar a parte inteira da decimal e ? é uma string a concatenar no fim (unidades). <br/>
                        Caso não queira padding, pode colocar um 0 no 4º argumento e caso não queira colocar a unidade, pode acabar a <i>String</i> do formato logo a seguir aos últimos 00. <br/>
                        Exemplo1: formattedFloat(2, 400, 3, 3, "0.0.00$") = "181.306$" <br/>
                        Exemplo2: formattedFloat(2, 5, 2, 0, "0.0.00") = "2.05"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        date
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Init:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre a data atual e a data argumento.<br/>
                        A <i>String</i> do argumento tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
                        O resultado é dado em versão JS raw. <br/> 
                        Exemplo: date("12-12-2100") = "2056-04-11T01:22:38.174Z"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        date
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Init:: <code>String</code>,<br/>
                        Form:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre a data atual e a data argumento, no formato dado.<br/>
                        A <i>String</i> do 1º argumento tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
			            Os formatos possíveis para o argumento Form são os seguintes: DD.MM.YYYY, DD.MM.AAAA, MM.DD.YYYY, MM.DD.AAAA, YYYY.MM.DD e AAAA.MM.DD, onde o . pode ser / - ou .<br/>
                        Exemplo: date("12-12-2100","DD.MM.AAAA") = "09.12.2083"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        date
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Init:: <code>String</code>,<br/>
                        Fim:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre as datas argumentos.<br/>
                        A <i>String</i> dos argumentos tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
                        O resultado é dado em versão JS raw. <br/> 
                        Exemplo: date("12-12-2100","20-12-2100") = "2100-12-16T12:11:08.049Z"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        date
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Init:: <code>String</code>,<br/>
                        Fim:: <code>String</code>,<br/>
                        Form:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre as datas argumentos, no formato dado.<br/>
                        A <i>String</i> dos 1ºs argumentos tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
			            Os formatos possíveis para o argumento Form são os seguintes: DD.MM.YYYY, DD.MM.AAAA, MM.DD.YYYY, MM.DD.AAAA, YYYY.MM.DD e AAAA.MM.DD, onde o . pode ser / - ou .<br/>
                        Exemplo: date("12-12-2100","20-12-2100","DD.MM.AAAA") = "18.12.2100"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        lorem 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Num:: <code>Integer</code>,<br/>
                        Parte:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera Num palavras, frases ou parágrafos de <i>lorem ipsum</i>. A varíavel Parte tem de ser igual a "words", "sentences" ou "paragraphs".<br/>
                        Exemplo: lorem(3,"words") = "mollit fugiat officia"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        random 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        arg1:: <code>Object</code>,<br/>
                        ...,<br/>
                        argN::<code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Retorna aleatoriamente um dos argumentos passados à função. <br/>
                        Exemplo: random("blue", null, true, false, 23, 17.56) = 23
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        position 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um conjunto de coordenadas cartesianas aleatórias. <br/>
                        Exemplo: position() = "(22.491, 101.037)"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        position 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        [MinLat,MaxLat]:: <code>[Float]</code>,<br/>
                        [MinLon,MaxLon]:: <code>[Float]</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um conjunto de coordenadas cartesianas aleatórias, com limites superiores e inferiores. <br/>
                        Exemplo: position([0.03,3],[-5,-2.4]) = "(1.311, -3.97)"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_phone_number
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número de telemóvel português. <br/>
                        Exemplo: pt_phone_number() = "911 154 239"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_phone_number
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        bool:: <code>Boolean</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número de telemóvel português, se bool==true é colocada a extensão. <br/>
                        Exemplo: pt_phone_number(true) = "+351 911 154 239"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_district
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um distrito português aleatório.<br/>
                        Exemplo: pt_district() = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_district
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Coun:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o distrito português do concelho dado em Coun.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "county".<br/>
                        Exemplo: pt_district("county","Braga") = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_district
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Par:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o distrito português da freguesia dada em Par.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "parish".<br/>
                        Exemplo: pt_district("parish","Tadim") = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_district
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Cit:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o distrito português da cidade dada em Cit.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "city".<br/>
                        Exemplo: pt_district("city","Barcelos") = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_county
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um concelho português aleatório.<br/>
                        Exemplo: pt_county() = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_county
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Dist:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um concelho português aleatório do distrito dado em Dist.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "district".<br/>
                        Exemplo: pt_county("district","Braga") = "Barcelos"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_county
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Coun:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o concelho português da freguesia dada em Coun.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "parish".<br/>
                        Exemplo: pt_country("parish","Tadim") = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_parish
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma freguesia portuguesa aleatória.<br/>
                        Exemplo: pt_parish() = "Tadim"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_parish
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Dist:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma freguesia portuguesa aleatória do distrito dado em Dist.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "district".<br/>
                        Exemplo: pt_parish("district","Braga") = "Tadim"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_parish
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Count:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma freguesia portuguesa aleatória do concelho dado em Count.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "county".<br/>
                        Exemplo: pt_parish("county","Braga") = "Tadim"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_city
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma cidade portuguesa aleatória.<br/>
                        Exemplo: pt_city() = "Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_city
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Def:: <code>String</code>, <br/>
                        Dist:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma cidade portuguesa aleatória do distrito dado em Dist.<br/>
                        O primeiro argumento tem de corresponder à <i>String</i> "district".<br/>
                        Exemplo: pt_parish("district","Braga") = "Barcelos"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um partido político aleatório e devolve um objeto com a abreviação e o nome correspondentes.<br/>
                        Exemplo: political_party() = { "party_abbr": "Fr", "party_name": "Aliança de Paz" }
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Cty:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um partido político aleatório do país dado em Cty e devolve um objeto com a abreviação e o nome correspondentes.<br/>
                        Exemplo: political_party("Portugal") = { "party_abbr": "BE", "party_name": "Bloco de Esquerda" }
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party_name
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o nome de um partido político aleatório.<br/>
                        Exemplo: political_party_name() = Aliança de Paz" 
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party_name
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Cty:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o nome de um partido político aleatório do país dado em Cty.<br/>
                        Exemplo: political_party_name("Portugal") = "Bloco de Esquerda"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party_abbr
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a abreviatura de um partido político aleatório.<br/>
                        Exemplo: political_party_abbr() = "Fr" 
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        political_party_abbr
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Cty:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a abreviatura de um partido político aleatório do país dado em Cty.<br/>
                        Exemplo: political_party_abbr("Portugal") = "BE"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_entity
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma entidade portuguesa aleatória e devolve um objeto com a sigla e a designação correspondentes.<br/>
                        Exemplo: political_party() = { "sigla": "CMBRG", "designacao": "Câmara Municipal de Braga" }
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_entity_abbr
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a sigla de uma entidade portuguesa aleatória.<br/>
                        Exemplo: pt_entity_abbr() = "CMBRG"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_entity_name
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a designação de uma entidade portuguesa aleatória.<br/>
                        Exemplo: pt_entity_name() = "Câmara Municipal de Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        soccer_club
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um clube de futebol aleatório.<br/>
                        Exemplo: soccer_club() = "Liverpool FC" 
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        soccer_club
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Object</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Cty:: <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um clube de futebol aleatório do país dado em Cty.<br/>
                        O nome do país pode ser dado em português ou em inglês e, para já, só são reconhecidos Portugal, Espanha, Itália, Inglaterra e Alemanha.<br/>
                        Exemplo: soccer_club("Portugal") = "SC Braga"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        actor
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um ator aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        animal
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um animal aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        brand
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma marca aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        buzzword
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma buzzword aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        capital
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma capital aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        car_brand
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma marca de carro aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        continent
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um continente aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        country
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um país aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        cultural_center
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um centro cultural aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        gov_entity
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma entidade governamental aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        hacker
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um hacker aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        job
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um trabalho aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        month
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um mês aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        musician
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um músico aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        nationality
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma nacionalidade aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_businessman
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um empresário português aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_politician
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um político português aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_public_figure
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma figura pública portuguesa aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pt_top100_celebrity
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma celebridade portuguesa aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        religion
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma religião aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        soccer_player
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um jogador de futebol aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        sport
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um desporto aleatório.
                    </div>
                </div>
            </div>
        </div>
                <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        top100_celebrity
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma celebridade aleatória.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        weekday
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um dia da semana aleatório.
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        writer
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    <div class="isrequired">
                        Nenhum
                    </div>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um escritor aleatório.
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br/>
    <hr/>
    <div>
        <h4>Exemplo DSL</h4>
        <codemirror 
                ref="example1"
                :value= "example1"
                :options="cmOption"
        />
    </div>
    <br/>
  </div>
</template>

<script>
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

import "codemirror/theme/dracula.css";
import 'codemirror/keymap/sublime'
import 'codemirror/mode/javascript/javascript.js'

export default {
  name: 'Documentation',
  data() {
      return {
        example1: `[
	'repeat(3)': {
        _id: '{{objectId()}}',
  		missing(50): {
        	boleano: '{{bool()}}'
        },
        posicao: '{{position()}}',
        telemovel: '{{phone()}}',
	  	range: range(5),
	  	string: "string",
	  	numero: 93,
	  	name: {
	    	first: "Universidade",
	    	last: "do Minho"
	  	},
	  	lista_exemplo: [
	  		"string",
	  		32,
	  		{
	  			elem: 1, 
                indice: 2, 
                lista_nested: [1,2,3], 
                range: range(3) 
            }
    	],
  		objeto: [
			'repeat(5)': {
  				indice_objeto: '{{index()}}'
  			}
		]
    }
]`,
        cmOption: {
          tabSize: 4,
          styleActiveLine: true,
          lineNumbers: true,
          line: true,
          foldGutter: true,
          styleSelectedText: true,
          mode: 'text/javascript',
          keyMap: "sublime",
          matchBrackets: true,
          showCursorWhenSelecting: true,
          theme: "dracula",
          extraKeys: { "Ctrl": "autocomplete" },
          hintOptions:{
            completeSingle: false
          }
        }
      }
    },
    computed: {
      codemirror() {
        return this.$refs.example1.codemirror
      }
    },
    mounted() {
      this.codemirror.setSize("100%", "100%")
    }
  }
</script>
<style scoped>
/* Methods */
.method .header, .method .cell {
  padding: 6px 6px 6px 10px; }
.method .list-header .header {
  font-weight: normal;
  text-transform: uppercase;
  font-size: 0.8em;
  color: #999;
  background-color: #eee; }
.method [class^="row"],
.method [class*=" row"] {
  border-bottom: 1px solid #ddd; }
  .method [class^="row"]:hover,
  .method [class*=" row"]:hover {
    background-color: #f7f7f7; }
.method .cell {
  font-size: 0.85em; }
  .method .cell .mobile-isrequired {
    display: none;
    font-weight: normal;
    text-transform: uppercase;
    color: #aaa;
    font-size: 0.8em; }
  .method .cell .propertyname {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; }
  .method .cell .type {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis; }
  .method .cell code {
    color: #428bca; }
  .method .cell a, .method .cell a:hover {
    text-decoration: none; }
  .method .cell code.custom {
    color: #8a6d3b;
    text-decoration: none; }
  .method .cell .text-muted {
    color: #ddd; }
@media (max-width: 991px) {
  .method [class^="row"],
  .method [class*=" row"] {
    padding-top: 10px;
    padding-bottom: 10px; }
  .method .cell {
    padding: 0 10px; }
    .method .cell .propertyname {
      font-weight: bold;
      font-size: 1.2em; }
      .method .cell .propertyname .lookuplink {
        font-weight: normal;
        font-size: 1.5em;
        position: absolute;
        top: 0;
        right: 10px; }
    .method .cell .type {
      padding-left: 10px;
      font-size: 1.1em; }
    .method .cell .isrequired {
      padding-left: 10px;
      display: none; }
    .method .cell .description {
      padding-left: 10px; }
    .method .cell .mobile-isrequired {
      display: inline; } }


/* Row Utilities */
[class^='row'].margin-0,
[class*=' row'].margin-0,
[class^='form-group'].margin-0,
[class*=' form-group'].margin-0 {
  margin-left: -0px;
  margin-right: -0px; }
  [class^='row'].margin-0 > [class^='col-'],
  [class^='row'].margin-0 > [class*=' col-'],
  [class*=' row'].margin-0 > [class^='col-'],
  [class*=' row'].margin-0 > [class*=' col-'],
  [class^='form-group'].margin-0 > [class^='col-'],
  [class^='form-group'].margin-0 > [class*=' col-'],
  [class*=' form-group'].margin-0 > [class^='col-'],
  [class*=' form-group'].margin-0 > [class*=' col-'] {
    padding-right: 0px;
    padding-left: 0px; }
  [class^='row'].margin-0 [class^='row'],
  [class^='row'].margin-0 [class*=' row'],
  [class^='row'].margin-0 [class^='form-group'],
  [class^='row'].margin-0 [class*=' form-group'],
  [class*=' row'].margin-0 [class^='row'],
  [class*=' row'].margin-0 [class*=' row'],
  [class*=' row'].margin-0 [class^='form-group'],
  [class*=' row'].margin-0 [class*=' form-group'],
  [class^='form-group'].margin-0 [class^='row'],
  [class^='form-group'].margin-0 [class*=' row'],
  [class^='form-group'].margin-0 [class^='form-group'],
  [class^='form-group'].margin-0 [class*=' form-group'],
  [class*=' form-group'].margin-0 [class^='row'],
  [class*=' form-group'].margin-0 [class*=' row'],
  [class*=' form-group'].margin-0 [class^='form-group'],
  [class*=' form-group'].margin-0 [class*=' form-group'] {
    margin-left: 0;
    margin-right: 0; }
</style>