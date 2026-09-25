# About this raw data

## About

This dataset is lab analysis results for years 2016 through 2026.

There's almost 5000 rows in the dataset.

## Fields

- RBR = plain row number
- SORTA = wine assortment
- TRADICIONALNI_IZRAZ = quality category
- GODINA = lab analysis year
- GODINA_BERBE = vintage year
- RESULT = total score
- ZOI = wine area
- BOJA = color
- Reducirajući_šećeri_gL = reducted sugar g/L
- Stvarni_alkohol_vol = actual alochol volume %
- Ukupna_kiselost_kao_vinska_gL = total acids g/L

## Field purpose

### Dimensions

We want to slice and dice analysis by these fields

- SORTA = wine assortment
- TRADICIONALNI_IZRAZ = quality category
- GODINA = lab analysis year
- GODINA_BERBE = vintage year
- RESULT = total score
- ZOI = wine area
- BOJA = color

#### Time fields

Time fields will most probably be used for x axis in charts or tables.

- GODINA = lab analysis year
- GODINA_BERBE = vintage year

### Values

Field average is what we need.

- Reducirajući_šećeri_gL = reducted sugar g/L
- Stvarni_alkohol_vol = actual alochol volume %
- Ukupna_kiselost_kao_vinska_gL = total acids g/L

## Example

RBR,SORTA,TRADICIONALNI_IZRAZ,GODINA,GODINA_BERBE,RESULT,ZOI,BOJA,Reducirajući_šećeri_gL,Stvarni_alkohol_vol,Ukupna_kiselost_kao_vinska_gL
1,Rajnski rizling (100.00%),KVALITETNO VINO KZP,2016,2015,72,HRVATSKO PODUNAVLJE,Bijelo,2.30,12.40,6.80
2,Graševina (100.00%),KVALITETNO VINO KZP,2016,2015,72,HRVATSKO PODUNAVLJE,Bijelo,1.60,11.40,6.50
3,Silvanac zeleni (100.00%),KVALITETNO VINO KZP,2016,2016,72,HRVATSKO PODUNAVLJE,Bijelo,1.60,11.56,6.90
4,Chardonnay (100.00%),KVALITETNO VINO KZP,2016,2015,72,ZAGORJE-MEĐIMURJE,Bijelo,3.10,12.40,6.50
