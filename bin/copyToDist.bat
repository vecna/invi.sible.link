 
mkdir -p dist\css
mkdir -p dist\js\local 
mkdir -p dist\images 
mkdir -p dist\js\vendor\

copy styles\index.css dist\css
copy pictures\*.png dist\images\
copy sections\webscripts\*.* dist\js\local\

copy node_modules\bootstrap\dist\css\bootstrap.* dist\css 
copy node_modules\jquery\dist\jquery.js dist\js\vendor\ 
copy node_modules\bootstrap\js\collapse.js dist\js\vendor\ 
copy node_modules\d3\build\d3.min.js dist\js\vendor\ 
copy node_modules\c3\c3.min.js dist\js\vendor\ 
copy node_modules\moment\min\moment.min.js dist\js\vendor\ 
copy node_modules\c3\c3.css dist\css
copy node_modules\bootstrap\dist\js\bootstrap.min.js dist\js\vendor\
copy node_modules\lodash\lodash.min.js dist\js\vendor\ 
copy node_modules\reveal.js\js\reveal.js dist\js\vendor\ 
copy node_modules\reveal.js\css\theme\solarized.css dist\css\reveal-solarized.css 
copy node_modules\reveal.js\css\reveal.css dist\css\reveal.css 
copy node_modules\reveal.js\lib\js\head.min.js dist\js\vendor\reveal-head.min.js
copy node_modules\reveal.js\js\reveal.js dist\js\vendor\reveal.min.js
copy node_modules\reveal.js\lib\js\classList.js dist\js\vendor\classList.js
copy node_modules\reveal.js\lib\font\league-gothic\*.* dist\css\
