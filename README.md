Preciso de um sistema `Monga Awards` que se assemelha a um Oscar, onde vamos poder criar usuarios, criar indicados, e criar categorias, vamos ter uma tela de admin onde vamos poder ver as categorias e a quantidade de votos em cada indicado relaionado a categoria, nunva iremos armazenar a informação de quem o usuario votou, apenas vamos computar que o usuario ja realizou o voto naquela ategoria e não pode votar mais então a categoria não fica mais disponivel para o usuario votar onde vamos ver na tabela VotosUsuarios para saber quais as vetegorias o usuario ja votou


Tables:
	- Usuarios
		- id
		- nickname
		- password
		- admin
	
	- Indicados
		- id
		- Nome
		- Foto
		
	- Categorias
		- id
		- Nome
		- Descricao
		- Banner
	
	- IndricadosCategorias
		- id
		- IndicadoID
		- CategoriaID
		
	- VotosCategoria
		- id
		- IndicadoID
		- CategoriaID

	- VotosUsuarios
		- id
		- CategoriaID
		

o backend deve ser postegres, o frontend deve ser html css e javascript com tailwind
no backend para criar o usuario, vamos ter uma tela que pede um codigo para poder aprovar a criação do usuario, o codigo deve ser inserido como uma var no .env e deve ser `monga123`
