#!/bin/sh
csv=campaigns/irantrex/iran1st.csv taskName=irantrex DEBUG=* bin/directionTool.js  
csv=campaigns/chuptrex/clinics-MX.csv taskName=clinics-MX DEBUG=* bin/directionTool.js  
csv=campaigns/chuptrex/clinics-CL.csv taskName=clinics-CL DEBUG=* bin/directionTool.js  
csv=campaigns/chuptrex/clinics-BR.csv taskName=clinics-BR DEBUG=* bin/directionTool.js  
csv=campaigns/chuptrex/clinics-CO.csv taskName=clinics-CO DEBUG=* bin/directionTool.js  
DEBUG=* bin/directionTool.js --csv campaigns/amtrex/halal-list.csv --taskName halal 
DEBUG=* bin/directionTool.js --csv campaigns/amtrex/culture-list.csv --taskName culture 
DEBUG=* bin/directionTool.js --csv campaigns/amtrex/mosques-list.csv --taskName mosques 
DEBUG=* bin/directionTool.js --csv campaigns/amtrex/travel-list.csv --taskName travel 
csv=campaigns/itatopex/lista.csv taskName=itatopex DEBUG=* bin/directionTool.js 
csv=campaigns/gptrex/gptrex.csv taskName=gptrex DEBUG=* bin/directionTool.js 
