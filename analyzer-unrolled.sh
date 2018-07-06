#!/bin/sh

DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "itatopex"
DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "itatopex"
DEBUG=* bin/analyzeGroup.js --campaign itatopex --daysago 0

DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "culture"
DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "culture"
DEBUG=* bin/analyzeGroup.js --campaign culture --daysago 0

DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "travel"
DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "travel"
DEBUG=* bin/analyzeGroup.js --campaign travel --daysago 0

DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "halal"
DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "halal"
DEBUG=* bin/analyzeGroup.js --campaign halal --daysago 0

DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "mosques"
DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "mosques"
DEBUG=* bin/analyzeGroup.js --campaign mosques --daysago 0
 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "ngos"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "ngos"
# DEBUG=* bin/analyzeGroup.js --campaign ngos --daysago 0
# 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "platforms"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "platforms"
# DEBUG=* bin/analyzeGroup.js --campaign platforms --daysago 0
# 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "gob.colombia"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "gob.colombia"
# DEBUG=* bin/analyzeGroup.js --campaign gob.colombia --daysago 0
# 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "gob.chile"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "gob.chile"
# DEBUG=* bin/analyzeGroup.js --campaign gob.chile --daysago 0
# 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "gob.brasil"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "gob.brasil"
# DEBUG=* bin/analyzeGroup.js --campaign gob.brasil --daysago 0
# 
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "gob.paraguay"
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "gob.paraguay"
# DEBUG=* bin/analyzeGroup.js --campaign gob.paraguay --daysago 0
# 
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "clinics-BR"
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "clinics-BR"
# DEBUG=* bin/analyzeGroup.js --campaign clinics-BR --daysago 0
# 
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "clinics-CO"
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "clinics-CO"
# DEBUG=* bin/analyzeGroup.js --campaign clinics-CO --daysago 0
# 
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "clinics-MX"
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "clinics-MX"
# DEBUG=* bin/analyzeGroup.js --campaign clinics-MX --daysago 0
# 
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "clinics-CL"
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "clinics-CL"
# DEBUG=* bin/analyzeGroup.js --campaign clinics-CL --daysago 0
# 
# DEBUG=* bin/analyzePhantom.js --config config/analyzerProduction.json --campaign "gptrex"
# DEBUG=* bin/analyzeBadger.js --config config/analyzerProduction.json --campaign "gptrex"
# DEBUG=* bin/analyzeGroup.js --campaign gptrex --daysago 0

