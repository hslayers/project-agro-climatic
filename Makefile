rsync:
	rsync -r -a -v -e ssh --delete dist/ raitis@data.plan4all.eu:/data/www/app.hslayers.org/htdocs/project-agro-climatic

build-prod:
	node_modules/.bin/webpack --config webpack.prod.js --progress

build-and-rsync:
	make build-prod && make rsync