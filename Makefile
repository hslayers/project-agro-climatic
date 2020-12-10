rsync:
	rsync -r -a -v -e ssh --delete dist/ raitis@data.plan4all.eu:/data/www/app.hslayers.org/htdocs/project-agro-climatic

build-prod:
	ng build --prod

build-and-rsync:
	make build-prod && make rsync

serve:
	ng serve