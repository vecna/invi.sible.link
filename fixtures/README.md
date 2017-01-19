# Initialization

## Lists

the starting lists are top 200 website from alexa, per country and per 
category, just to have some test website to work on. 

via **vigile** componentes, it is possible extend them, change them,
update them.

```
aaѪaa:~/Dev/invi.sible.link$ DEBUG=* node fixtures/initialize.js 
  fixtures opening fixtures/data/worldWideRanks.json +0ms
  fixtures opening fixtures/data/categoriesRanks.json +9ms
  fixtures byCountry produced 127 lists +445ms
  fixtures +byCategory reach 143 lists +7ms
  mongo writeMany in lists of 143 objects +21ms
aaѪaa:~/Dev/invi.sible.link$ 
```

## TLD

https://publicsuffix.org/, <3 Mozilla, Moz://a


    wget https://publicsuffix.org/list/public_suffix_list.dat
    cat public_suffix_list.dat | grep -v "^//" | sort | sed -es/^/\"/ | sed -es/$/\",/ > pseudoJSON

