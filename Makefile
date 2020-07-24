rsync:
	rsync -r -a -v -e ssh --delete dist/ raitis@ng.hslayers.org:/data/www/app.hslayers.org/htdocs/project-agro-climatic