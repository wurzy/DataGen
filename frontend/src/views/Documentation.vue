<template>
  <div class="container" style="text-align: justify; text-justify: inter-word;">
    <br/>
    <h2 style="display:inline; margin-right: 10px;" >Documentação</h2> 

    <a :href="'/datagen_manual.pdf'" style="display:inline; " download>
        <font-awesome-icon style="margin-bottom: 2px;" icon="download"/>
    </a>

    <hr/>
    <div>
        <h4>Introdução</h4>
        <p>
            A aplicação usa um compilador baseado numa gramática <a href="https://pegjs.org/online">PEG.js</a> para processar o input do utilizador e gerar o dataset pretendido. A gramática mencionada define uma linguagem específica de domínio (DSL), com sintaxe semelhante a JSON, disponibilizando muitas
ferramentas que permitem a geração de datasets complexos e diversificados. Estas ferramentas incluem capacidades relacionais e lógicas, fornecendo meios para os datasets satisfazerem vários tipos de limitações - o que facilita a utilização de frameworks declarativas com esta
especificação -, bem como capacidades funcionais, permitindo uma gestão e processamento facilitados de certas propriedades dos datasets.
        </p>
        <p>A primeira e mais fundamental das ferramentas implementadas é a sintaxe semelhante a
JSON - o utilizador pode especificar propriedades chave-valor, onde o valor pode tomar qualquer tipo básico ou estrutura de dados JSON, desde inteiros a objetos e arrays. O utilizador
pode também aninhar estes valores para criar uma estrutura com qualquer profundidade que
pretenda.</p>
        <codemirror 
                ref="grammar1"
                :value= "grammar1"
                :options="cmOption"
        />
    </div>
    <hr/>
    <div>
        <h4>Definição de Pares Chave-Valor</h4>
        <p>Um par chave-valor é composto por dois elementos separadas por dois pontos (<b>:</b>).</p> 
        <p>A chave não pode conter espaços brancos (exceto entre o último caractere da <i>String</i> e o separador) nem qualquer outro caractere que não pertença ao alfabeto ou que não seja um <i>underscore</i>.</p>
        <p>Por exemplo, <code>lorem_ipsum</code> é uma chave válida enquanto <code>lorem ipsum</code>, <code>lorem:ipsum</code> ou <code>lorem-ipsum</code> não são.</p>
        <p>A única exceção é a diretiva <code>repeat</code>, que está entre plicas e que recebe como argumento um inteiro. Esta é responsável por gerar um <i>array</i> de objetos cujo comprimento é o dado por argumento.</p>
        <p>Os valores podem ser um dos seguintes:</p>
        <ul>
            <li>Número</li>
            <li><i>String</i></li>
            <li><i>Array</i></li>
            <li>Boleano</li>
            <li>null</li>
            <li id="moustaches">Objeto DSL</li>
            <li>Função "Moustache"</li>
        </ul>
    </div>
    <hr/>
    <div>
        <h4>Interpolações (Funções "Moustache")</h4>
        <p>
            Para definir o valor de uma propriedade, o utilizador pode também usar interpolação. Para
aceder a uma função de interpolação, esta necessita de estar envolta em chavetas duplas. Há
dois tipos de funções de interpolação:
        </p>
        <ul>
            <li>
                <b>Funções de geração espontânea</b>: geram valores espontâneos em tempo de execução, de acordo com as instruções do utilizador - por exemplo, existe uma função de geração de números inteiros
aleatórios, onde o utilizador precisa de indicar, no mínimo, a gama de valores que
pretende para o resultado:
                <codemirror 
                    ref="grammar4"
                    :value= "grammar4"
                    :options="cmOption"
                />
                <br/>
            </li>
            <li>
                <b>Funções com suporte de datasets</b>: retornam valores aleatórios de um grupo de datasets incorporados na
aplicação por detrás de uma API, onde cada dataset possui informação de uma dada
categoria, por exemplo nomes e partidos políticos:
                <codemirror 
                    ref="grammar5"
                    :value= "grammar5"
                    :options="cmOption"
                />
                <br/>
            </li>
        </ul>
        <p>
            Estas funções de interpolação podem também ser interligadas entre si e com <i>Strings</i> elementares para gerar <i>Strings</i> mais estruturadas, nomeadamente moradas. Algumas destas
funções recebem argumentos e, nesse caso, o utilizador tanto pode introduzir manualmente
os valores, como pode referenciar outras propriedades definidas acima no modelo, através da
variável local <code>this</code>, permitindo assim estabelecer relações entre vários campos.
        </p>
            <codemirror 
                ref="grammar6"
                :value= "grammar6"
                :options="cmOption"
            />
            <br/>
        <p>
            O utilizador pode ainda chamar a função <code>.string()</code> à frente de uma interpolação para converter o seu valor para <i>String</i>.
Isto é redundante se o valor de retorno já for uma <i>string</i>, mas pode ser usado para converter resultados de funções que retornem outros tipos.
        </p>
            <codemirror 
                ref="grammar16"
                :value= "grammar16"
                :options="cmOption"
            />
            <br/>
        <p id="gen_moustaches">De seguida, estão explícitas todas as funções de interpolação que se encontram atualmente disponíveis (os argumentos que têm um asterisco podem ser referenciados localmente através da chave <code>this</code>).</p>
    </div>
    <br>
    <h5>Funções de geração espontânea:</h5>
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um boleano aleatório. <br/>
                        Exemplo: boolean() = true <br/>
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
                        *Init:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre a data atual e a data Init.<br/>
                        A <i>String</i> do Init tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
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
                        *Init:: <code>String</code>,<br/>
                        Form:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre a data atual e a data Init, no formato dado.<br/>
                        A <i>String</i> do argumento Init tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
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
                        *Init:: <code>String</code>,<br/>
                        *Fim:: <code>String</code>
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
                        *Init:: <code>String</code>,<br/>
                        *Fim:: <code>String</code>,<br/>
                        Form:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma data aleatória entre as datas argumentos, no formato dado.<br/>
                        A <i>String</i> dos argumentos Init e Fim tem de ter o formato "DD[./-]MM[./-]YYYY".<br/>
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
                        *Min:: <code>Float</code>,<br/>
                        *Max:: <code>Float</code>
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
                        *Min:: <code>Float</code>,<br/>
                        *Max:: <code>Float</code>,<br/>
                        *Dec:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número decimal aleatório entre Min e Max com um total de Dec casas decimais. <br/>
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
                        *Min:: <code>Integer</code>,<br/>
                        *Max:: <code>Integer</code>,<br/>
                        *Pad:: <code>Integer</code>,<br/>
                        Unid:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um inteiro aleatório entre Min e Max, garante que tem pelo menos tantos algarismos quantos especificados no Pad e acrescenta uma <i>String</i> Unid no final. <br/>
                        Caso não queira padding, pode colocar um 0 no Pad e caso não queira colocar a unidade, pode colocar um "" no Unid.<br/>
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
                        *Min:: <code>Integer</code>,<br/>
                        *Max:: <code>Integer</code>,<br/>
                        *Dec:: <code>Integer</code>,<br/>
                        *Pad:: <code>Integer</code>,<br/>
                        Form:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número decimal aleatório entre Min e Max com um total de Dec casas decimais e garante que tem pelo menos tantos algarismos na parte inteira quantos especificados no Pad. <br/>
                        Por fim, recebe um formato no argumento Form na forma "0#0#00?", onde o primeiro # é um caractere para separar cada 3 algarismos de inteiros, o segundo # separa a parte inteira da decimal e ? é uma string a concatenar no fim (unidades). <br/>
                        Caso não queira padding, pode colocar um 0 no Pad e caso não queira colocar uma unidade, pode acabar a <i>String</i> do formato logo a seguir aos últimos 00. <br/>
                        Exemplo1: formattedFloat(2, 400, 3, 4, "0.0,00$") = "0.181,306$" <br/>
                        Exemplo2: formattedFloat(2, 5, 2, 0, "0.0,00") = "2,05"
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um UUID aleatório. <br/>
                        Exemplo: guid() = "3d16d5d0-4b11-4de8-9e26-6668b52d9219"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        hexBinary 
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
                    *Len:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string de caracteres hexadecimais aleatórios, com Len caracteres.<br/>
                        Exemplo: hexBinary(5) = "4D3E764128"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        hexBinary 
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
                    *Min:: <code>Integer</code>,<br>
                    *Max:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string de caracteres hexadecimais aleatórios, com um número aleatório de caracteres entre Min e Max.<br/>
                        Exemplo: hexBinary(2,7) = "2B2222443841"
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Retorna o índice atual no array em que se encontra (normal ou gerado pelo 'repeat'). <br/>
                        Exemplo: index() = 1 <br/>
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
                        *Min:: <code>Integer</code>,<br/>
                        *Max:: <code>Integer</code>
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
                        integerOfSize 
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
                    *Size:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número inteiro com o número de dígitos igual a Size. <br/>
                        Exemplo: integerOfSize(4) = 1234<br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        language 
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a abreviatura de uma língua aleatória.<br/>
                        Exemplo: language() = "pt"<br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        language 
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
                    *Len:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a abreviatura de uma língua aleatória, com comprimento Len. As abreviaturas consideradas têm todas 2 ou 5 caracteres, por isso Len deve ser um destes valores. Caso contrário, o argumento é ignorado e é retornada uma abreviatura aleatória.<br/>
                        Exemplo1: language(2) = "fr"<br/>
                        Exemplo2: language(5) = "it-ch"<br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        letter 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Character</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um caractere aleatório. <br/>
                        Exemplo: letter() = 'a'<br/>
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        letter 
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="cell">
                    <div class="type">
                        <code>Character</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                    Type:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um caractere aleatório em maiúscula ou minúscula, dado em Type. O Type pode ser dado em português ou inglês.<br/>
                        Exemplo: letter("uppercase") = 'A'<br/>
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
                        Unid:: <code>String</code>,<br/>
                        *Num:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera Num palavras, frases ou parágrafos de <i>lorem ipsum</i>. A variável Unid tem de corresponder a "palavras", "frases" ou "parágrafos", podendo ser dada em português ou inglês.<br/>
                        Exemplo: lorem("words", 3) = "mollit fugiat officia"
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
                        Unid:: <code>String</code>,<br/>
                        *Min:: <code>Integer</code>,<br/>
                        *Max:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera entre Min e Max palavras, frases ou parágrafos de <i>lorem ipsum</i>. A variável Unid tem de corresponder a "palavras", "frases" ou "parágrafos", podendo ser dada em português ou inglês.<br/>
                        Exemplo: lorem("words", 1, 5) = "aute voluptate dolore veniam"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        multipleOf 
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
                        *Num:: <code>Float</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um múltiplo do argumento.<br/>
                        Exemplo: multipleOf(5.5) = 511.5
                    </div>
                </div>
            </div>
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um ID aleatório com 24 bytes. <br/>
                        Exemplo: objectID() = "6048e87b9281fc9a1afe8e61"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        pattern 
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
                        *Regex:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string em conformidade com a expressão regular dada como argumento. <br/>
                        Exemplo: pattern("^(\([0-9]{3}\))?[0-9]{3}-[0-9]{4}$") = "(157)289-5490"
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um conjunto de coordenadas geográficas aleatórias. <br/>
                        Exemplo: position() = "(67.95632, -55.44137)"
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
                        *[*MinLat,*MaxLat]:: <code>[Float]</code>,<br/>
                        *[*MinLon,*MaxLon]:: <code>[Float]</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um conjunto de coordenadas cartesianas aleatórias, dentro dos limites dados. <br/>
                        Exemplo: position([0.03,3],[-5,-2.4]) = "(0.26275, -4.03904)"
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
                        Nenhum
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
                        Bool:: <code>Boolean</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um número de telemóvel português e com Bool==true é colocada a extensão. <br/>
                        Exemplo: pt_phone_number(true) = "+351 911 154 239"
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
                        *Arg1:: <code>Object</code>,<br/>
                        ...,<br/>
                        *ArgN:: <code>Object</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Retorna aleatoriamente um dos argumentos passados à função.<br/>
                        Exemplo: random("blue", true, false, 23, 17.56) = 23
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        stringOfSize 
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
                        *Len:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string <i>lorem ipsum</i> com o comprimento dado como argumento.<br/>
                        Exemplo: stringOfSize(25) = "Consectetur sint non eius"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        stringOfSize 
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
                        *Min:: <code>Integer</code>,<br>
                        *Max:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string <i>lorem ipsum</i> com comprimento entre Min e Max.<br/>
                        Exemplo: stringOfSize(5,25) = "Magna nulla"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        time 
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
                        Form:: <code>String</code>,<br/>
                        Inter:: <code>Integer</code>,<br/>
                        Unid:: <code>Boolean</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma hora do dia aleatória. <br/>
                        Form corresponde ao formato em termos de horas, minutos e segundos e pode ser um dos seguintes: "hh:mm:ss", "hh:mm", "hh:ss", "hh:mm", "hh", "mm", "ss". <br/>
                        Inter pode ser 12 ou 24 e representa o intervalo de horas usado. Se for selecionado o formato de relógio de 12 horas, as horas do tempo gerado estarão sempre entre a 01 e as 12, e o tempo virá com "AM" ou "PM" à frente para indicar se é de manhã ou de tarde. <br/>
                        Unid é um boleano que indica se se pretende unidades no tempo gerado ou não. Em caso afirmativo, em vez do formato "hh:mm:ss", o tempo virá com as unidades "h min s". <br/>
                        Exemplo1: time("hh:mm:ss", 12, false) = "09:21:01 AM" <br/>
                        Exemplo2: time("hh:mm:ss", 24, true) = "22h 46min 30s" <br/>
                        Exemplo3: time("hh:mm", 12, true) = "11h 43min PM"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        time 
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
                        Form:: <code>String</code>,<br/>
                        Inter:: <code>Integer</code>,<br/>
                        Unid:: <code>Boolean</code>,<br/>
                        *Init:: <code>String</code>,<br/>
                        *Fim:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma hora do dia aleatória entre os tempos Init e Fim. <br/>
                        Form corresponde ao formato em termos de horas, minutos e segundos e pode ser um dos seguintes: "hh:mm:ss", "hh:mm", "hh:ss", "hh:mm", "hh", "mm", "ss". <br/>
                        Inter pode ser 12 ou 24 e representa o intervalo de horas usado. Se for selecionado o formato de relógio de 12 horas, as horas do tempo gerado estarão sempre entre a 01 e as 12, e o tempo virá com "AM" ou "PM" à frente para indicar se é de manhã ou de tarde. <br/>
                        Unid é um boleano que indica se se pretende unidades no tempo gerado ou não. Em caso afirmativo, em vez do formato "hh:mm:ss", o tempo virá com as unidades "h min s". <br/>
                        A <i>String</i> dos argumentos Init e Fim tem de ter o formato "hh:mm:ss" e corresponder a uma hora do dia válida. <br/>
                        Exemplo1: time("hh:mm:ss", 12, false, "13:30:00", "15:15:15") = "02:18:08 PM" <br/>
                        Exemplo2: time("hh:mm:ss", 24, true, "13:30:00", "15:15:15") = "14h 43min 03s" <br/>
                        Exemplo3: time("hh:mm", 24, true, "13:30:00", "15:15:15") = "13h 39min"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_date
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
                        Min:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>date</code>, nativo de <i>XML Schema</i>, correspondente a uma data.<br/>
                        O argumento corresponde ao limite inferior do valor deve ser gerado, e deve estar no formato em questão: "YYYY-MM-DD".<br/>
                        Exemplo: xsd_date("1999-08-26") = "2009-09-15"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_date
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>date</code>, nativo de <i>XML Schema</i>, correspondente a uma data.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "YYYY-MM-DD".<br/>
                        Exemplo: xsd_date("2012-06-30", "2020-03-12") = "2018-05-29"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_dateTime
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
                        Min:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>dateTime</code>, nativo de <i>XML Schema</i>, correspondente a uma data e hora.<br/>
                        O argumento corresponde ao limite inferior do valor deve ser gerado, e deve estar no formato em questão: "YYYY-MM-DDThh:mm:ss".<br/>
                        Exemplo: xsd_dateTime("1950-01-06T12:12:12") = "1987-11-13T04:56:56"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_dateTime
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>dateTime</code>, nativo de <i>XML Schema</i>, correspondente a uma data e hora.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "YYYY-MM-DDThh:mm:ss".<br/>
                        Exemplo: xsd_dateTime("2020-01-06T20:30:00","2020-01-07T05:00:00") = "2020-01-06T23:07:10"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_duration
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>duration</code>, nativo de <i>XML Schema</i>, correspondente a uma duração.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "PnYnMnDTnHnMnS".<br/>
                        Exemplo: xsd_duration("P1Y2M", "P2Y3DT4H4M20.123S") = "P2Y1DT2H3M15.59S"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gDay
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gDay</code>, nativo de <i>XML Schema</i>, correspondente a um dia do mês.<br/>
                        Exemplo: xsd_gDay() = "---05"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gDay
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gDay</code>, nativo de <i>XML Schema</i>, correspondente a um dia do mês.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "---DD".<br/>
                        Exemplo: xsd_gDay("---05", "---20") = "---17"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gMonth
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gMonth</code>, nativo de <i>XML Schema</i>, correspondente a um mês do ano.<br/>
                        Exemplo: xsd_gMonth() = "--05"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gMonth
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gMonth</code>, nativo de <i>XML Schema</i>, correspondente a um mês do ano.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "--MM".<br/>
                        Exemplo: xsd_gMonth("--03", "--10") = "--06"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gMonthDay
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gMonthDay</code>, nativo de <i>XML Schema</i>, correspondente a um dia de um mês.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "--MM-DD".<br/>
                        Exemplo: xsd_gMonthDay("--02-15", "--07-10") = "--04-09"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gYear
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gYear</code>, nativo de <i>XML Schema</i>, correspondente a um ano.<br/>
                        Exemplo: xsd_gYear() = "1970"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gYear
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gYear</code>, nativo de <i>XML Schema</i>, correspondente a um ano.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "YYYY".<br/>
                        Exemplo: xsd_gYear("1950", "2017") = "1997"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_gYearMonth
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
                        Min:: <code>String</code>,<br>
                        Max:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um valor do tipo de dados <code>gYearMonth</code>, nativo de <i>XML Schema</i>, correspondente a um mês de um ano.<br/>
                        Os argumentos correspondem aos limites entre os quais o valor deve ser gerado, e devem estar no formato em questão: "YYYY-MM".<br/>
                        Exemplo: xsd_gYearMonth("2002-02", "2008-05") = "2005-04"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_string 
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
                        Tipo:: <code>String</code>,<br>
                        *Len:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string do tipo de dados textual nativo de <i>XML Schema</i> indicado, com o comprimento dado.<br/>
                        O primeiro argumento tem de ser um dos seguintes tipos: <code>ENTITY</code>, <code>Name</code>, <code>NCName</code>, <code>NMTOKEN</code>, <code>normalizedString</code>, <code>NOTATION</code>, <code>QName</code>, <code>string</code> ou <code>token</code>.<br/>
                        Exemplo: xsd_string("normalizedString", 10) = "gc97 nI 50"
                    </div>
                </div>
            </div>
        </div>
        <div class="row margin-0">
            <div class="col-md-2">
                <div class="cell">
                    <div class="propertyname">
                        xsd_string 
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
                        Tipo:: <code>String</code>,<br>
                        *Min:: <code>Integer</code>,<br>
                        *Max:: <code>Integer</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma string do tipo de dados textual nativo de <i>XML Schema</i> indicado, com um comprimento entre Min e Max.<br/>
                        <span id="dataset_moustaches">O primeiro argumento tem de ser um dos seguintes tipos: <code>ENTITY</code>, <code>Name</code>, <code>NCName</code>, <code>NMTOKEN</code>, <code>normalizedString</code>, <code>NOTATION</code>, <code>QName</code>, <code>string</code> ou <code>token</code>.</span><br/>
                        Exemplo: xsd_string("normalizedString", 10, 15) = "pkqPGRh lZK4"
                    </div>
                </div>
            </div>
        </div>
    </div>
    <br>
    <h5>Funções com suporte de datasets:</h5>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome de um ator aleatório. <br/>
                        Exemplo: actor() = "Ian McKellen" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um animal aleatório. <br/>
                        Exemplo: animal() = "Baleia" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma marca aleatória. <br/>
                        Exemplo: brand() = "Ford" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma buzzword aleatória. <br/>
                        Exemplo: buzzword() = "Ansiedade" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma capital aleatória. <br/>
                        Exemplo: capital() = "Cairo" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma marca de carro aleatória. <br/>
                        Exemplo: car_brand() = "Lamborghini" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um continente aleatório. <br/>
                        Exemplo: continent() = "África" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um país aleatório. <br/>
                        Exemplo: country() = "Alemanha" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um centro cultural aleatório. <br/>
                        Exemplo: cultural_center() = "Stonehenge" <br/>
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome próprio aleatório. <br/>
                        Exemplo: firstName() = "Hugo" <br/>
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome completo aleatório. <br/>
                        Exemplo: surname() = "Isa Filipa Oliveirinha" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma entidade governamental aleatória. <br/>
                        Exemplo: gov_entity() = "ASAE" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um nome de um hacker aleatório. <br/>
                        Exemplo: hacker() = "ioerror" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma profissão aleatório. <br/>
                        Exemplo: job() = "Sapateiro" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um mês aleatório. <br/>
                        Exemplo: month() = "Março" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um músico aleatório. <br/>
                        Exemplo: musician() = "John Lennon" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma nacionalidade aleatória. <br/>
                        Exemplo: nationality() = "Australiano" <br/>
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
                        Nenhum
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
                        *Cty:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um partido político aleatório do país dado em Cty e devolve um objeto com a abreviação e o nome correspondentes. O nome do país pode ser dado em português ou inglês.<br/>
                        Exemplo: political_party("Portugal") = { "party_abbr": "BE", "party_name": "Bloco de Esquerda" }
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
                        Nenhum
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
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                        *Cty:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera a abreviatura de um partido político aleatório do país dado em Cty. O nome do país pode ser dado em português ou inglês.<br/>
                        Exemplo: political_party_abbr("Portugal") = "BE"
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o nome de um partido político aleatório.<br/>
                        Exemplo: political_party_name() = "Aliança de Paz" 
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
                        *Cty:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o nome de um partido político aleatório do país dado em Cty. O nome do país pode ser dado em português ou inglês.<br/>
                        Exemplo: political_party_name("Portugal") = "Bloco de Esquerda"
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um empresário português aleatório. <br/>
                        Exemplo: pt_businessman() = "Manuel Cordo Boullosa" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma cidade portuguesa aleatória.<br/>
                        Exemplo: pt_city() = "Braga" <br/>
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
                        Def:: <code>String</code>, <br/>
                        *Dist:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma cidade portuguesa aleatória do distrito dado em Dist.<br/>
                        O primeiro argumento tem de corresponder à`s <i>Strings</i> "district" ou "distrito".<br/>
                        Exemplo: pt_city("district","Braga") = "Barcelos" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um concelho português aleatório.<br/>
                        Exemplo: pt_county() = "Beja" <br/>
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
                        Def:: <code>String</code>, <br/>
                        *Dist:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um concelho português aleatório do distrito dado em Dist.<br/>
                        O primeiro argumento tem de corresponder às <i>Strings</i> "district" ou "distrito".<br/>
                        Exemplo: pt_county("district","Braga") = "Barcelos" <br/>
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
                        Def:: <code>String</code>, <br/>
                        *Coun:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o concelho português da freguesia dada em Coun.<br/>
                        O primeiro argumento tem de corresponder às <i>Strings</i> "parish" ou "freguesia".<br/>
                        Exemplo: pt_county("parish","Tadim") = "Braga" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um distrito português aleatório.<br/>
                        Exemplo: pt_district() = "Braga" <br/>
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
                        Def:: <code>String</code>, <br/>
                        *Loc:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera o distrito português do concelho, freguesia ou cidade dada em Loc.<br/>
                        O primeiro argumento tem de corresponder às <i>Strings</i> "county", "parish" ou "city", que também podem ser dadas em português.<br/>
                        Exemplo1: pt_district("county","Braga") = "Braga" <br/>
                        Exemplo2: pt_district("parish","Fermentelos") = "Aveiro" <br/>
                        Exemplo2: pt_district("city","Torres Vedras") = "Lisboa" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma entidade portuguesa aleatória e devolve um objeto com a sigla e a designação correspondentes.<br/>
                        Exemplo: pt_entity() = { "abbr": "CMBRG", "name": "Câmara Municipal de Braga" }
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
                        Nenhum
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
                        Nenhum
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma freguesia portuguesa aleatória.<br/>
                        Exemplo: pt_parish() = "Tadim" <br/>
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
                        Def:: <code>String</code>, <br/>
                        *Loc:: <code>String</code>
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma freguesia portuguesa aleatória do distrito ou concelho dado em Loc.<br/>
                        O primeiro argumento tem de corresponder às <i>Strings</i> "district" ou "county", que também podem ser dadas em português.<br/>
                        Exemplo1: pt_parish("district","Braga") = "Macieira de Rates" <br/>
                        Exemplo2: pt_parish("county","Braga") = "Adaúfe" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um político português aleatório. <br/>
                        Exemplo: pt_politician() = "Francisco Manuel Costa Fernandes" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma figura pública portuguesa aleatória. <br/>
                        Exemplo: pt_public_figure() = "João Manzarra" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma celebridade portuguesa aleatória. <br/>
                        Exemplo: pt_top100_celebrity() = "Ricardo Araújo Pereira" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma religião aleatória. <br/>
                        Exemplo: religion() = "Protestantismo" <br/>
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
                        Nenhum
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
                        <code>String</code>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="cell">
                        *Cty:: <code>String</code>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um jogador de futebol aleatório. <br/>
                        Exemplo: soccer_player() = "Eden Hazard" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um desporto aleatório. <br/>
                        Exemplo: sport() = "Voleibol" <br/>
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
                    Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um apelido aleatório. <br/>
                        Exemplo: surname() = "Rodrigues" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera uma celebridade aleatória. <br/>
                        Exemplo: top100_celebrity() = "Lady Gaga" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um dia da semana aleatório. <br/>
                        Exemplo: weekday() = "Quinta-feira" <br/>
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
                        Nenhum
                </div>
            </div>
            <div class="col-md-5">
                <div class="cell">
                    <div class="description">
                        Gera um escritor aleatório. <br/>
                        Exemplo: writer() = "J. R. R. Tolkien" <br/>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <hr/>
    <div>
        <h4>Primitiva 'repeat'</h4>
        <p>Para especificar o tamanho do dataset, ou de um array aninhado, existe a diretiva <code>repeat</code>,
onde o utilizador indica a estrutura que pretende replicar (que pode ser qualquer uma, desde
um tipo JSON primitivo até um objeto complexo), bem como o número de cópias, ou intervalo
de números.
        </p>
        <codemirror 
                ref="grammar2"
                :value= "grammar2"
                :options="cmOption"
        />
        <br/>
        <p>
            O utilizador pode também definir tantas coleções quantas pretenda num único modelo (são
consideradas coleções as propriedades chave-valor no nível superior do modelo) e a aplicação
retornará o dataset resultante em sintaxe <i>json-server</i> - um objeto com uma propriedade
por coleção. Durante o processamento do input, a aplicação constrói recursivamente tanto o dataset final como o modelo Strapi para a estrutura especificada, concorrentemente, de
maneira a permitir a integração posterior numa API RESTful.
        </p>
        <codemirror 
                ref="grammar3"
                :value= "grammar3"
                :options="cmOption"
        />
        <br/>
    </div>
    <hr/>
    <div>
        <h4>Primitiva 'local_variables'</h4>
        <p>O utilizador pode usar esta diretiva para definir variáveis locais no modelo, que não aparecerão no dataset final.
Esta ferramenta pode ser útil para codificar raciocínios complexos e preparar valores intermédios "invisíveis", para referenciar noutras propriedades.
Estas variáveis têm uma <i>scope</i> local, ou seja, se forem declaradas dentro de um objeto, apenas serão accessíveis dentro desse mesmo objeto.
Além disso, também só poderão ser referenciadas em propriedades que apareçam posteriormente no modelo, e nunca antes (acima).
        </p>
        <codemirror 
                ref="grammar17"
                :value= "grammar17"
                :options="cmOption"
        />
        <br/>
    </div>
    <hr/>
    <div>
        <h4>Primitiva 'range'</h4>
        <p>Esta implementação da função 'range' é equivalente à implementação do <i>Python</i> e retorna uma sequência de números inteiros. 
        A função tem a seguinte sintaxe: <code>range(start, stop, step)</code>, onde apenas o argumento <i>start</i> é obrigatório.</p>
        <p>Se for dado apenas o argumento <i>start</i>, a sequência de números resultante começa em 0 e para antes de <i>start</i>, incrementando 1 unidade de cada vez.</p>
        <p>Se forem dados apenas os argumentos <i>start</i> e <i>stop</i>, a sequência resultante começa em <i>start</i> e para antes de <i>stop</i>, incrementando 1 unidade de cada vez.</p>
        <p>Se forem dados os 3 argumentos, a sequência resultante começa em <i>start</i> e para antes de <i>stop</i>, incrementando <i>step</i> unidades de cada vez.</p>
        <p>Caso o utilizador tente fazer um ciclo infinito, o programa dará erro e avisá-lo-á disso.</p>
        <codemirror 
                ref="grammar15"
                :value= "grammar15"
                :options="cmOption"
        />
        <br/>
    </div>
    <hr/>
    <div>
        <h4>Primitiva 'unique'</h4>
        <p>
            A gramática também disponibiliza uma ferramenta chamada <code>unique()</code>, à qual o utilizador
pode dar uma função de interpolação, ou uma string interpolada com uma função dessas, como
argumento. O <code>unique</code> garante que as funções de interpolação às quais é aplicado retornam
sempre valores únicos, no contexto do dataset final. Isto é especialmente relevante no que
toca a funções de interpolação que vão buscar informação aleatória aos datasets de suporte
do DataGen, dentro de uma diretiva <code>repeat</code>, visto que não há nenhuma garantia base de que
retornarão valores sempre diferentes e o utilizador pode querer que isso não aconteça.
        </p>
        <p>
            Como tal, a função <code>unique</code> apenas tem algum efeito quando aplicada em funções de
interpolação dos datasets de suporte ou com a função <code>random</code>. Desde que seja um destes dois casos (possivelmente
interpolados com strings normais) e haja entradas distintas suficientes nos datasets para todos
os elementos do <code>repeat</code>, o <code>unique</code> garante que todos os objetos do dataset resultante terão
um valor diferente na propriedade em questão. Se o utilizador usar como argumento uma
string com mais do que uma função de interpolação, também não haverá nenhum efeito -
poderá haver combinações de valores repetidas no fim.
        </p>
        <p>
            De seguida, são apresentados dois exemplos: o primeiro demonstra a utilização correta da
função <code>unique</code>; o segundo mostra casos de uma abordagem errada (não haver valores distintos
suficientes para o <code>repeat</code>; não ser uma função de interpolação dos datasets de suporte; mais
do que uma função de interpolação na string) que ou não funcionarão ou não terão nenhuma
garantia de exclusividade mútua para os valores resultantes:
        </p>
        <codemirror 
                ref="grammar8"
                :value= "grammar8"
                :options="cmOption"
        />
        <br/>
    </div>
    <hr/>
    <div>
        <h4>Primitivas map/filter/reduce</h4>
        <p>
            A gramática também disponibiliza uma implementação das ferramentas de
programação funcional fundamentais - <code>map</code>, <code>filter</code> e <code>reduce</code>. O utilizador pode utilizar uma ou
várias destas funções com um valor array (de qualquer uma das várias formas de declaração de arrays disponibilizadas na gramática). Sintaxe <i>shorthand</i> não é permitida, pelo que o
utilizador deve sempre abrir chavetas para o bloco de código dentro da função. Tirando
isso, esta implementação funciona exatamente como a implementação nativa do Javascript: o
utilizador pode declarar a função dentro <code>map</code>/<code>filter</code>/<code>reduce</code> ou usar sintaxe anónima para as
variáveis; nas variáveis, pode declarar apenas o valor atual ou, adicionalmente, qualquer uma
das outras variáveis complementares menos comuns. De seguida, é possível observar vários
exemplos distintos do uso destas ferramentas:
        </p>
            <codemirror 
                    ref="grammar14"
                    :value= "grammar14"
                    :options="cmOption"
            />
            <br/>
    </div>   
    <hr/>
    <div>
        <h4>Execução de Código / Funções</h4>
        <p>
            De volta às propriedades do modelo, o utilizador pode também usar funções de Javascript
para definir o seu valor. Existem dois tipos de funções: funções assinadas, onde o nome do
método corresponde à chave da propriedade e o resultado do corpo da função ao valor; funções
<i>arrow</i> anónimas, que são usadas para indicar apenas o valor da propriedade (a chave precisa
de ser especificada antes da função).
        </p>
        <codemirror 
                ref="grammar9"
                :value= "grammar9"
                :options="cmOption"
        />
        <br/>
        <p>
            Dentro destas funções, o utilizador é livre de escrever todo o código de Javascript que
pretenda, que será posteriormente executado para determinar o valor da propriedade. Desta
forma, torna-se possível incorporar algoritmos mais complexos na lógica de construção do
dataset, permitindo uma ferramenta de geração mais especializada e versátil. Dado que o
utilizador tem acesso a toda a sintaxe de Javascript, pode também fazer uso de operadores relacionais e lógicos para elaborar condições sobre os dados pretendidos, bem como de
métodos funcionais (por exemplo <code>map</code> e <code>filter</code>, que são implementados pelo Javascript).
        </p>
        <p>
            Dentro destes blocos de código, o utilizador tem acesso total a qualquer propriedade
declarada acima no modelo da DSL, através da variável local <code>this</code>, bem como a qualquer
função de interpolação disponível na gramática, através da variável local <code>gen</code> - sempre que
usar uma função para definir o valor de uma propriedade do modelo, o utilizador tem a necessidade
de declarar este argumento na sua assinatura, ao qual pode aceder posteriormente no corpo
da função para aceder às ditas funções de interpolação. Tudo isto pode ser observado no
exemplo acima.
        </p>
        <p>
            É ainda de realçar que, caso o utilizador tente fazer uma invocação inválida de uma função de interpolação através do <code>gen</code>, 
por exemplo um <code>integer("string", 10)</code> ou um <code>political_party("Oceano Pacífico")</code>, 
será retornado um valor <code>null</code> ou <code>false</code> dentro da função Javascript, 
por isso o utilizador precisa de verificar com bastante cuidado se o nome da função e os argumentos estão corretos.
        </p>
    </div>
    <hr/>
    <div>
        <h4>Geração Difusa</h4>
        <p>
            A gramática também permite geração difusa de propriedades, isto é, a imposição de
restrições sobre a existência de certas propriedades, com base em condições lógicas ou probabilidades. A gramática possui quatro ferramentas diferentes para este fim:
        </p>
        <ul>
            <li>
                Diretivas <code>missing</code>/<code>having</code> - como argumento, recebem a probabilidade de as propriedades contidas nelas (não) existirem no dataset final; esta probabilidade é calculada
para cada elemento, originando assim um dataset onde alguns elementos podem ter as
propriedades em questão e outros não:
                <codemirror 
                    ref="grammar10"
                    :value= "grammar10"
                    :options="cmOption"
                />
                <br/>
            </li>
            <li>
                Condições <code>if</code>... <code>else if</code>... <code>else</code> - estas funcionam como em qualquer linguagem de
programação: o utilizador pode usar operadores relacionais e outros condicionais para
criar condições e juntá-las com a ajuda de operadores lógicos. O objeto final terá as
propriedades especificadas no bloco da primeira condição que se verificar (ou eventualmente nenhuma delas, se todas as condições forem falsas). Nestas condições, semelhante
ao modo de funcionamento das funções, o utilizador tem acesso ilimitado a todas as
propriedades declaradas acima no modelo da DSL, bem como a todas as funções de
interpolação, o que cria a possibilidade de relacionar causalmente diferentes propriedades:
                <codemirror 
                    ref="grammar11"
                    :value= "grammar11"
                    :options="cmOption"
                />
                <br/>
            </li>
            <li>
                A diretiva <code>or</code> - a gramática disponibiliza esta operador lógico para permitir a prototipagem ágil de propriedades mutuamente exclusivas, onde apenas uma delas será
selecionada aleatoriamente para cada objeto (note-se que não faz sentido criar uma diretiva and, pois isso seria equivalente a simplesmente listar as propriedades pretendidas
normalmente no modelo da DSL):
                <codemirror 
                    ref="grammar12"
                    :value= "grammar12"
                    :options="cmOption"
                />
                <br/>
            </li>
            <li>
                A diretiva <code>at_least</code> - dentro deste bloco, o utilizador escreve um conjunto de propriedades e dá como argumento o número mínimo dessas propriedades que deve estar
presente no objeto final. O compilador seleciona um conjunto dessas propriedades aleatoriamente, entre o mínimo dado e o total:
                <codemirror 
                    ref="grammar13"
                    :value= "grammar13"
                    :options="cmOption"
                />
                <br/>
            </li>
        </ul>
    </div>
    <hr/>
    <div>
        <h4>Datasets</h4>
        <p>
            Em relação à API de datasets, a equipa realizou uma pesquisa extensiva por datasets
com informação útil, utilizou os datasets bem-estruturados que encontrou e aproveitou a
informação que pode dos restantes, processando-a para remover erros e normalizar o seu conteúdo, posteriormente agrupando todos os dados da mesma categoria de forma a criar
datasets maiores e dotados de maior complexidade para colocar ao serviço do utilizador.
        </p>
        <p>
            A equipa também criou alguns datasets originais manualmente, para tópicos considerados
relevantes, e introduziu suporte bilingue - português e inglês - em todos os datasets disponibilizados na aplicação, de forma a dar ao utilizador a liberdade de escolher a linguagem
que melhor se adequa ao seu objetivo. Para indicar a sua linguagem de eleição, o modelo do
utilizador deve começar com a seguinte sintaxe:
        </p>
        <codemirror 
                ref="grammar7"
                :value= "grammar7"
                :options="cmOption"
        />
        <br/>
        <p>Atualmente, o DataGen tem datasets de suporte para todas as categorias listadas de
seguida:</p>
        <ul>
            <li>atores;</li>
            <li>animais;</li>
            <li>capitais;</li>
            <li>centros culturais;</li>
            <li>cidades;</li>
            <li>clubes de futebol;</li>
            <li>continentes;</li>
            <li>desportos;</li>
            <li>dias da semana</li>
            <li>distritos, cidades, concelhos e freguesias portuguesas;</li>
            <li>empresários portugueses;</li>
            <li>entidades governamentais;</li>
            <li>escritores;</li>
            <li>figuras públicas portuguesas;</li>
            <li>futebolistas;</li>
            <li>hackers;</li>
            <li>marcas;</li>
            <li>marcas de carros;</li>
            <li>meses;</li>
            <li>músicos;</li>
            <li>nacionalidades;</li>
            <li>nomes;</li>
            <li>países;</li>
            <li><i>buzzwords</i></li>
            <li>partidos políticos;</li>
            <li>profissões</li>
            <li>políticos portugueses;</li>
            <li>religiões;</li>
            <li>top 100 celebridades;</li>
            <li>top 100 celebridades portuguesas.</li>
        </ul>
    </div>
    <hr/>
    <div>
        <h4>Rotas Aplicacionais</h4>
        As seguintes rotas REST são disponibilizadas como alternativa à interface gráfica:
        <ul>
            <li>
                <b><code>POST</code> /api/datagen/</b>
                <p>O corpo tem de conter o modelo da gramática (DSL) em formato <i>raw</i>, isto é, não envolvido por aspas.</p>
                <p>Esta rota gera um objeto JSON com o dataset (também em JSON) e campos adicionais necessários para a sua inserção no Strapi.</p>
            </li>
            <li><b>
                <code>POST</code> /api/datagen/json</b>
                <p>O corpo tem de conter o modelo da gramática (DSL) em formato raw, isto é, não envolvido por aspas.</p>
                <p>Esta rota retorna apenas o dataset resultante em formato JSON.</p>
            </li>
            <li>
                <b><code>POST</code> /api/datagen/xml</b>
                <p>O corpo tem de conter o modelo da gramática (DSL) em formato raw, isto é, não envolvido por aspas.</p>
                <p>Esta rota retorna apenas o dataset resultante em formato XML.</p>
            </li>
            <li>
                <b><code>POST</code> /api/datagen/csv</b>
                <p>O corpo tem de conter o modelo da gramática (DSL) em formato raw, isto é, não envolvido por aspas.</p>
                <p>Esta rota retorna apenas o dataset resultante em formato CSV.</p>
            </li>
        </ul>
        Para além destas rotas, são também disponibilizadas rotas para obter os datasets utilizados na aplicação:
        <ul>
            <li>
                <b><code>GET</code> /api/dataset/:nome</b>
                <p>Este <code>nome</code> terá de ser um dos seguintes:</p>
                <ul>
                    <li>actors</li>
                    <li>animals</li>
                    <li>brands</li>
                    <li>buzzwords</li>
                    <li>capitals</li>
                    <li>car_brands</li>
                    <li>continents</li>
                    <li>countries</li>
                    <li>cultural_centers</li>
                    <li>gov_entities</li>
                    <li>hackers</li>
                    <li>jobs</li>
                    <li>months</li>
                    <li>musicians</li>
                    <li>names</li>
                    <li>nationalities</li>
                    <li>political_parties</li>
                    <li>pt_businessmen</li>
                    <li>pt_districts</li>
                    <li>pt_entities</li>
                    <li>pt_politicians</li>
                    <li>pt_public_figures</li>
                    <li>pt_top100_celebrities</li>
                    <li>religions</li>
                    <li>soccer_clubs</li>
                    <li>soccer_players</li>
                    <li>sports</li>
                    <li>top100_celebrities</li>
                    <li>weekdays</li>
                    <li>writers</li>
                </ul>
            </li>
        </ul>
    </div>
    <hr/>
    <div>
        <h4>Informação Adicional</h4>
        <p>O principal propósito desta ferramenta é a geração de datasets (arrays de objetos) a partir do modelo do utilizador, pelo que foi projetada na expectativa de que o valor de cada coleção do modelo seja definido por um 'repeat'. 
            </p><p>Caso se definam as coleções de outra maneira (tipos primitivos, estruturas de dados explícitas ou funções), o dataset será gerado corretamente na mesma, mas a API não.</p>
    </div>
    <hr/>
    <div>
        <h4>Modelos Exemplo</h4>
        <p>
            O primeiro exemplo refere-se a um conjunto de utilizadores que utilizam uma aplicação de leitura de livros. As seguintes informações são necessárias:
            <ul>
                <li>
                    <b>nome</b>
                </li>
                <li><b>idade</b></li>
                <li><b>número do BI/CC</b></li>
                <li><b>descrição</b> que é opcional (há uma chance de 70%)</li>
                <li><b>número de livros</b> lidos no total</li>
                <li><b>listagem dos livros</b> lidos:
                    <ul>
                        <li><b>título</b></li>
                        <li><b>suporte</b> (físico ou digital)</li>
                        <li><b>rating</b> do utilizador</li>
                    </ul>
                </li>
                <li><b>livro favorito</b> da lista anterior</li>
            </ul>
        </p>

        <codemirror 
                ref="example3"
                :value= "example3"
                :options="cmOption"
        />
        <br/>
        <router-link :to="{name: 'Home', params: {userModel: example3}}">
            <button  class="btn btn-primary" style="margin-right: 5px"><font-awesome-icon icon="external-link-alt"/> Usar Modelo</button>
        </router-link>
        <br/><br/>
        <p>
            O segundo exemplo refere-se a um caso académico da representação, utilizando grafos, de 100 cidades portuguesas únicas, que atuam como os seus nodos. Estas têm:
            <ul>
                <li><b>id</b> que é dado por <code>c{N}</code> onde N é um número inteiro</li>
                <li><b>nome</b></li>
                <li><b>população</b> que é um número inteiro entre 1500 e 550000</li>
                <li><b>descrição</b></li>
                <li><b>distrito</b> da cidade</li>
            </ul>
            As arestas são as ligações entre as cidades (2000 no total):
            <ul>
                <li><b>id</b> que é dado por <code>l{id_ligação}-{id_origem}-{id_destino}</code></li>
                <li><b>origem</b> que é o <b>id</b> da cidade onde a ligação começa</li>
                <li><b>destino</b> que é o <b>id</b> da cidade onde a ligação termina</li>
                <li><b>distância</b> que é um número entre 5 e 600</li>
            </ul>
        </p>
        <codemirror 
                ref="example1"
                :value= "example1"
                :options="cmOption"
        />
        <br/>
        <router-link :to="{name: 'Home', params: {userModel: example1}}">
            <button  class="btn btn-primary" style="margin-right: 5px"><font-awesome-icon icon="external-link-alt"/> Usar Modelo</button>
        </router-link>
        <br/><br/>
        <p>O terceiro exemplo refere-se a um pequeno excerto de Autos de Eliminação que são, resumidamente, uma estrutura que deve ser criada e cuidadosamente preenchida
de maneira a eliminar documentação que atinja o prazo da sua conservação administrativa
de forma segura. </p>
        <p>Neste exemplo serão abordadas apenas as seguintes secções desse documento:
        </p>
        <ul>
            <li><b>tipo</b> da fonte de legitimação, que poderá ser "PGD/LC", "TS/LC", "PGD", "RADA" ou "RADA/CLAV"</li>
            <li><b>fundos</b> que dependem do <b>tipo</b>:
                <ul>
                    <li>se o tipo for "PGD/LC", "TS/LC" ou "PGD", só tem um fundo (entidade)</li>
                    <li>se não, tem entre 1 a 5 fundos (entidades)</li>
                </ul>
            </li>
            <li><b>classes</b> que são entre 2 e 5 e que dependem do <b>tipo</b>:
                <ul>
                    <li>se o tipo for "PGD/LC" ou "TS/LC", tem um código (que pode ter 3 ou 4 níveis)</li>
                    <li>se não, pode ter um código, uma referência ou ambos</li>
                </ul> 
            </li>
        </ul>
        <codemirror 
                ref="example2"
                :value= "example2"
                :options="cmOption"
        />
        <br/>
        <router-link :to="{name: 'Home', params: {userModel: example2}}">
            <button  class="btn btn-primary" style="margin-right: 5px"><font-awesome-icon icon="external-link-alt"/> Usar Modelo</button>
        </router-link>
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
        grammar1: `nome: {
    first: ["Hugo", "Cardoso"],
    last: "Miguel"
},
age: 21`,
        grammar2: `nomes: [ 'repeat(150,200)': {
    first: '{{firstName()}}',
    last: '{{surname()}}'
}]`,
        grammar3: `{
    nomes: [ 'repeat(10)': '{{fullName()}}' ],
    animais: [ 'repeat(20)': '{{animal()}}' ]
}`,
        grammar4: `id: '{{objectId()}}',
int: '{{integer(50,100)}}',
random: '{{random(23, "olá", [1,2,3], true)}}'`,
        grammar5: `nome: '{{fullName()}}',
partido: '{{political_party()}}'`,
        grammar6: `freguesia: '{{pt_parish()}}',
distrito: '{{pt_district("parish", this.parish)}}',
morada: 'Rua {{fullName()}}, {{pt_city("district", this.district)}}'`,
        grammar7:`<!LANGUAGE pt> // ou alternativamente
<!LANGUAGE en>`,
        grammar8: `// Primeiro caso
[ 'repeat(6)': {
    continente: unique('{{continent()}}'),
    país: unique('Country: {{country()}}'),
    aleatório: unique('{{random(1,2,3,4,5,6)}}')
} ]
// Segundo caso
[ 'repeat(10)': {
    continente: unique('{{continent()}}'),
    inteiro: unique('{{integer(5,20)}}'),
    aleatório: unique('{{firstName()}} {{surname()}}')
} ]
`, 
        grammar9:`nome: "André",
email(gen) {
    var i = gen.integer(1,30);
    return \`\${this.nome}.\${gen.surname()}\${i}@gmail.com\`.toLowerCase();
},
probabilidade: gen => { return Math.random() * 100; }`,
        grammar10: `missing(50) { prop1: 1, prop2: 2 },
having(80) { prop3: 3 }`,
        grammar11: `tipo: ’{{random("A","B","C")}}’,
if (this.tipo == "A") { A: "tipo A" }
else if (this.tipo == "B") { B: "tipo B" }
else { C: "tipo C" }`,
        grammar12: `or() {
    prop1: 1,
    prop2: 2,
    prop3: 3
}`,
        grammar13:`at_least(2) {
    prop1: 1,
    prop2: 2,
    prop3: 3
}`,
        grammar14:`map: range(5).map(value => { return value+1 }),
filter: [0,1,2].filter(function(value, index) {return [0,1,2][index]>0}),
reduce: range(5).reduce((accum, value, index, array) => {
            return accum + array[index] 
        }),
combinados: range(5).map((value) => { return value+3 })
                    .filter(x => { return x >= 5})
                    .map(x => { return x*2 }).reduce((a,c) => {return a+c})`,
        grammar15: `{
    range1: range(5),
    range2: range(1,-8),
    range3: range(-5,20,3)
}`,
        grammar16: `int: '{{integer(5,15)}}'.string(),
bool: '{{boolean()}}'.string()`,
        grammar17: `local_variables() {
	nr_livros: '{{integer(1,10)}}',
    avaliador: '{{fullName()}}'
},
livros: [ 'repeat(this.nr_livros)': {
	titulo: '{{lorem("words", 1)}}',
    suporte: '{{random("Físico","Digital")}}',
    rating: '{{integer(1,5)}}',
    avaliador(gen) { return this.avaliador }
} ]`,
        example1: `<!LANGUAGE pt>
{
  	cidades: [ 'repeat(100)': {
        id_cidade: 'c{{index(1)}}',
        nome: unique('{{pt_city()}}'),
        população: '{{integer(1500, 550000)}}',
        descrição: '{{lorem("paragraphs", 1)}}',
        distrito: '{{pt_district("city", this.nome)}}'
  	}],
  	ligações(gen) {
		var id = 1
      	var cidades = this.cidades.map(x => x.id_cidade)
		var possiveis = cidades.flatMap((v, i) => cidades.slice(i+1).map( w => v + '|' + w ))
  		var ligs = []
        
        for (var i = 0; i < 2000; i++) {
			let l = gen.random(...possiveis)
			possiveis.splice(possiveis.indexOf(l), 1)

			var split = l.split('|')
      		ligs.push({
				id_ligação: \`l\${id++}-\${split[0]}-\${split[1]}\`,
				origem: split[0],
				destino: split[1],
				distância: gen.float(5, 600)
			})
        }
		
		return ligs
  	}
}`,
        example2: `<!LANGUAGE pt>
{
  autoEliminação: {
        fonteLegitimação: {
          	tipo: '{{random("PGD/LC", "TS/LC", "PGD", "RADA", "RADA/CLAV")}}'
        },
    	fundos(gen) {
        	if (["PGD/LC","TS/LC","PGD"].includes(this.fonteLegitimação.tipo))
            		return [gen.pt_entity()]
          	else {
            		var arr = []
                	for (var i = 0; i < gen.integer(1,5); i++) arr.push(gen.pt_entity())
            		return arr
            	}
        },
    	classes: [ 'repeat(2,5)': {
            if (["PGD/LC","TS/LC"].includes(this.fonteLegitimação.tipo)) {
              	código: gen => {
                  	var nivel1 = gen.random(...gen.range(100,950,50))
                  	var nivel2 = gen.random(10,20,30,40,50)
                  	var nivel3 = gen.integer(1,999,3)
                 	 var nivel4 = gen.random("01","02")

                  	var classe = nivel1 + '.' + nivel2 + '.' + nivel3
                  	if (Math.random() > 0.5) classe += '.' + nivel4
		  	return classe
              	}
	    }
            else {
              	at_least(1) {
                  	código(gen) {
                  		var nivel1 = gen.random(...gen.range(100,950,50))
                        	var nivel2 = gen.random(10,20,30,40,50)
                        	var nivel3 = gen.integer(001,999)
                        	var nivel4 = gen.random("01","02")

                        	var classe = nivel1 + '.' + nivel2 + '.' + nivel3
                        	if (Math.random() > 0.5) classe += '.' + nivel4
                       		return classe
                    	},
            		referência: '{{random(1,2,3,55,56)}}'
              	}
          }
      }]
  }
}`,
        example3:`<!LANGUAGE pt>
{
  perfil: [
	'repeat(3)': {
        nome: '{{fullName()}}',
    	idade: '{{integer(15,60)}}',
  		or() {
          	BI: '{{integerOfSize(8)}}-{{integer(0,9)}}',
          	CC: '{{integerOfSize(8)}}-{{integer(0,9)}}-{{letter("uppercase")}}{{letter("uppercase")}}{{integer(0,9)}}'
        },
    	having(70) {
  			descrição: '{{lorem("sentences", 1)}}'
		},
        nr_livros: '{{integer(1,10)}}',
        livros: [ 'repeat(this.nr_livros)': {
        	titulo: '{{lorem("words",1)}}',
            suporte: '{{random("Físico","Digital")}}',
            rating: '{{integer(1,5)}}'
        } ],
        livro_favorito(gen) {
          var titulos = this.livros.map(x => x.titulo)
          return gen.random(...titulos)
      	}
    }
  ]
}`,
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