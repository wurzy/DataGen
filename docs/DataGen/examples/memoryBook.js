<!LANGUAGE pt>
{
	user: [ 'repeat(200)': {
  		id_user: {
           $oid: '{{objectId()}}'
        },
        username(gen) {
        	return gen.fullName().toLowerCase().replace(/ /g, "_")
        },
        email: '{{this.username}}{{integer(1,30)}}@{{random("gmail","outlook","hotmail")}}.com',
        having(60) {
        	about: '{{lorem("paragraphs",1)}}'
        },
        password: "$2a$10$xW41yTib.nnZIJTr0sEP5usfKtNyE3i60riuwmrnogzLkIhlnpiki",
        date_of_birth: gen => {
        	var start = new Date(1960,1,1)
        	var end = new Date(2000,1,1)
        	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        },
        createdAt: {
        	$date: gen => {
            	var start = new Date(2010,1,1)
            	var end = new Date(2021,5,1)
            	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        },
        profile_picture: null,
        level: "consumer"
	}],
	user_collection: [ 'repeat(200)': {
  		id_collection: {
           $oid: '{{objectId()}}'
        },
        name: 'Coleção {{index(1)}}',
        public: '{{boolean()}}',
        missing(30) {
        	description: '{{lorem("sentences", 1)}}'
        },
        createdAt: {
        	$date: gen => {
            	var start = new Date(2010,1,1)
            	var end = new Date(2021,5,1)
            	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        },
        collection_picture: null
	}],
	memory: [ 'repeat(500)': {
  		id_memory: {
           $oid: '{{objectId()}}'
        },
        title: 'Memória {{index(1)}}',
        local: '{{pt_parish()}}',
        date_of_memory: gen => {
            var start = new Date(1975,1,1)
            var end = new Date(2021,1,1)
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        },
        createdAt: {
        	$date: gen => {
            	var start = new Date(2010,1,1)
            	var end = new Date(2021,5,1)
            	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        },
        content: '{{lorem("paragraphs", 1)}}'
	}],
	person: [ 'repeat(300)': {
  		id_person: {
           $oid: '{{objectId()}}'
        },
        name: '{{fullName()}}',
        createdAt: {
        	$date: gen => {
            	var start = new Date(2010,1,1)
            	var end = new Date(2021,5,1)
            	return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        },
        missing(20) {
          	local_of_birth: '{{pt_city()}}'
        },
        having(70) {
            date_of_birth: gen => {
                var start = new Date(1960,1,1)
                var end = new Date(2000,1,1)
                return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
        },
        having(20) {
            date_of_death: gen => {
                var start = new Date(1980,1,1)
                var end = new Date(2020,1,1)
                return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
            }
  		}
	}]
}
