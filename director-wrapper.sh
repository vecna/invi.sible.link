#!/bin/sh

DEBUG=* csv=campaigns/chuptrex/clinics-MX.csv taskName=clinics-MX bin/directionTool.js  
DEBUG=* csv=campaigns/chuptrex/clinics-CL.csv taskName=clinics-CL bin/directionTool.js  
DEBUG=* csv=campaigns/chuptrex/clinics-BR.csv taskName=clinics-BR bin/directionTool.js  
DEBUG=* csv=campaigns/chuptrex/clinics-CO.csv taskName=clinics-CO bin/directionTool.js  

DEBUG=* csv=campaigns/irantrex/iran1st.csv taskName=irantrex bin/directionTool.js  
DEBUG=* csv=campaigns/itatopex/lista.csv taskName=itatopex bin/directionTool.js 

DEBUG=* csv=campaigns/gptrex/gptrex.csv taskName=gptrex bin/directionTool.js 
DEBUG=* csv=campaigns/fiftyshadesofpoland/list.csv taskName=poland bin/directionTool.js 

DEBUG=* csv=campaigns/amtrex/halal-list.csv taskName=halal bin/directionTool.js
DEBUG=* csv=campaigns/amtrex/culture-list.csv taskName=culture bin/directionTool.js
DEBUG=* csv=campaigns/amtrex/mosques-list.csv taskName=mosques bin/directionTool.js
DEBUG=* csv=campaigns/amtrex/travel-list.csv taskName=travel bin/directionTool.js
