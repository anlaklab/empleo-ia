# Validación cruzada del dataset «IA y Empleo en España» (v15) frente al estudio Funcas DT-2026/04

**Convergencia macro (r = 0.936) y descomposición a 4 dígitos CNO-11**

| Campo | Valor |
|---|---|
| Autor | Álvaro de Nicolás (Anlak Studio) — alvarodenicolas@gmail.com |
| Fecha | 30 de abril de 2026 |
| Versión | Adenda v1 al dataset v15 / metodología v30 |
| Concept DOI | 10.5281/zenodo.19076797 (todas las versiones) |
| Metodología principal | 10.5281/zenodo.19186444 (v30 / v14, marzo 2026) |
| Estudio referenciado | Rodríguez-Fernández, F. (2026). *Inteligencia artificial y mercado de trabajo en España*. Funcas, abril 2026. |
| Licencia | CC BY 4.0 |
| Dashboard | empleo-ai.anlakstudio.com |

## Resumen

El 30 de abril de 2026, Funcas publica el documento de trabajo «Inteligencia artificial y mercado de trabajo en España. Exposición ocupacional, efectos sobre el empleo y adopción empresarial», firmado por Francisco Rodríguez-Fernández (UGR/Funcas), con cobertura simultánea en El Mundo. Esta nota documenta una validación cruzada entre los resultados agregados a 9 grandes grupos CNO-11 del estudio Funcas y el dataset «IA y Empleo en España» v15, que opera al cuarto dígito de la CNO-11 sobre 502 ocupaciones. La correlación de Pearson entre los valores AIOE-CNO publicados en el Cuadro 2 del estudio y la vulnerabilidad media ponderada por empleo del dataset v15, agregada al primer dígito, es **r = 0.936** (Spearman ρ = 0.830). Dos metodologías independientes, construidas sobre inputs disjuntos —AIOE de Felten et al. (2023) adaptado a la CNO-11 mediante doble correspondencia SOC→ISCO→CNO frente a puntuación per-ocupación con validación adversarial entre siete modelos de IA generativa— convergen al nivel macro. La descomposición a cuatro dígitos del dataset v15 abre dentro de cada gran grupo la heterogeneidad ocupacional que la agregación a un dígito no puede capturar, y permite identificar concentraciones específicas de vulnerabilidad ≥7: 1.039.883 trabajadores en el grupo 4 (Empleados contables y administrativos), 1.165.519 en el grupo 3 (Técnicos y profesionales de apoyo) y 542.223 en el grupo 2 (Técnicos y profesionales científicos).

**Palabras clave:** inteligencia artificial, mercado de trabajo, vulnerabilidad ocupacional, CNO-11, AIOE, validación cruzada, Funcas, España.

---

## 1. Introducción y motivación

El 30 de abril de 2026, Funcas publica el documento de trabajo titulado «Inteligencia artificial y mercado de trabajo en España. Exposición ocupacional, efectos sobre el empleo y adopción empresarial», firmado por Francisco Rodríguez-Fernández, Catedrático de Economía de la Universidad de Granada e Investigador Senior de Funcas (Rodríguez-Fernández, 2026). El estudio aplica el índice AIOE de Felten et al. (2023) adaptado a la Clasificación Nacional de Ocupaciones (CNO-11) y estima una destrucción bruta de empleo de entre 1,7 y 2,3 millones de puestos en un horizonte de diez años (2025-2035), con un valor central aproximado de 2,0 millones. La cobertura mediática simultánea en El Mundo, titulada «El primer gran informe que mide el impacto de la IA en el empleo en España anticipa la destrucción de 2,3 millones de puestos de trabajo», sitúa este trabajo como referencia en el debate público español sobre IA y empleo.

El dataset «IA y Empleo en España», cuya versión v14 está depositada en Zenodo bajo la metodología v30 (DOI 10.5281/zenodo.19186444), comparte con el estudio Funcas un objeto de análisis idéntico —el impacto de la IA en el mercado laboral español— pero opera con una metodología sustancialmente distinta. Mientras que el modelo Funcas estima destrucción esperada en un horizonte de diez años bajo parámetros calibrados de adopción tecnológica, el dataset v15 puntúa cada ocupación con un valor de vulnerabilidad teórica entre 0 y 10 que representa el techo bajo plena adopción, sin asumir velocidad de difusión. Funcas opera al primer dígito de la CNO-11 (nueve grandes grupos); v15 opera al cuarto dígito (502 ocupaciones).

Esta nota metodológica complementaria documenta tres contribuciones. Primero, una validación cruzada formal entre ambas metodologías al nivel de los nueve grandes grupos CNO-11. Segundo, una descomposición a cuatro dígitos de los cuatro grupos que el estudio Funcas identifica como concentradores de la destrucción estimada (grupos 1, 2, 3 y 4). Tercero, una discusión técnica sobre dónde y por qué los dos modelos divergen, con énfasis en la complementariedad de las dos capas de análisis.

> [Rodríguez-Fernández, 2026, §3.1]: «dado que la desagregación a un nivel inferior al de los nueve grandes grupos de la CNO-11 no está disponible con suficiente precisión en las publicaciones de prensa del INE, las cifras de ocupados por grupo se han obtenido de la publicación trimestral de la propia encuesta».

## 2. Marco metodológico comparativo

### 2.1. Modelo Funcas (Rodríguez-Fernández, 2026)

El estudio Funcas adopta el índice AI Occupational Exposure (AIOE) construido por Felten et al. (2023) sobre la clasificación SOC norteamericana, y lo adapta a la CNO-11 mediante una doble correspondencia SOC→ISCO→CNO penalizada por un parámetro φ = 0,82. La estimación de destrucción se calcula como ΔEmp_sust(i) = −Ocup(i) × AIOE_CNO(i) × δ_sust × γ × ρ, con parámetros calibrados (δ_sust = 0,22; γ = 0,65; ρ = 0,21). El umbral de aplicación es α = 0,35. El horizonte temporal son diez años. El output del modelo son cifras de destrucción esperada por gran grupo CNO-11 (1 dígito), bajo tres escenarios (optimista, central, pesimista), tabuladas en el Cuadro 2 del documento de trabajo.

### 2.2. Dataset v15 «IA y Empleo en España» (Anlak Studio)

El dataset v15 puntúa cada una de las 502 ocupaciones CNO-11 a 4 dígitos con un valor de vulnerabilidad a la IA en escala 0-10. La puntuación se construye mediante descomposición en cuatro sub-componentes (rutinariedad cognitiva, rutinariedad manual, contenido creativo-estratégico, contenido interpersonal-físico) y se valida adversarialmente entre siete modelos de IA generativa en tres oleadas formales documentadas en el Apéndice G de la metodología v30. La correlación inter-modelo es r = 0,953 tras el rescoring. La capa de empleo se construye mediante una cascada de cuatro fuentes (EPA → Censo 2021 → SEPE 2024). La capa salarial se reconstruye a partir de la EES 2023 ajustada con primas educativas del INE y proxies intra-grupo de Francia y Portugal, validada con MAPE de 4,96%.

### 2.3. Qué es y qué no es esta validación cruzada

Las dos magnitudes —destrucción esperada en 10 años (Funcas) y vulnerabilidad teórica al techo (v15)— no son directamente comparables en términos absolutos. Lo que sí es comparable es el ordenamiento relativo de los grandes grupos CNO-11 en cada modelo y la correlación entre el AIOE-CNO publicado por Funcas y la vulnerabilidad ponderada por empleo del dataset v15 cuando se agrega al mismo nivel de un dígito. Si dos metodologías independientes ordenan los grupos de forma similar, ese resultado constituye una forma de validación mutua: la convergencia macro es informativa precisamente porque las dos rutas de cálculo no comparten dependencias.

## 3. Validación cruzada al nivel de los 9 grandes grupos CNO-11

| CNO 1d | Gran grupo | Empleo v15 | Empleo Funcas | AIOE-CNO | Vuln. pond. v15 | Workers ≥7 | % grupo ≥7 |
|---|---|---|---|---|---|---|---|
| 0 | Fuerzas Armadas | 99.400 | 70.000 | 0.10 | 2.00 | 0 | 0.0% |
| 1 | Directores y gerentes | 939.800 | 870.000 | 0.52 | 4.82 | 0 | 0.0% |
| 2 | Técnicos y profesionales científicos | 4.618.700 | 4.350.000 | 0.63 | 4.70 | 542.223 | 11.7% |
| 3 | Técnicos y profesionales de apoyo | 2.685.200 | 2.900.000 | 0.55 | 5.57 | 1.165.519 | 43.4% |
| 4 | Empleados contables y administrativos | 2.132.500 | 2.100.000 | 0.60 | 6.60 | 1.039.883 | 48.8% |
| 5 | Trabajadores de servicios y comercio | 4.982.523 | 4.050.000 | 0.20 | 2.67 | 5.336 | 0.1% |
| 6 | Trab. cualificados agrícolas y pesqueros | 437.200 | 540.000 | 0.10 | 2.50 | 0 | 0.0% |
| 7 | Artesanos e industria manufacturera | 2.386.200 | 2.150.000 | 0.15 | 2.00 | 0 | 0.0% |
| 8 | Operadores de instalaciones | 1.684.600 | 1.650.000 | 0.13 | 2.91 | 0 | 0.0% |
| 9 | Ocupaciones elementales | 2.766.100 | 3.780.000 | 0.08 | 1.32 | 0 | 0.0% |

**Tabla 1.** Comparación grupo a grupo entre el Cuadro 2 del estudio Funcas y los agregados a 1 dígito del dataset v15. La «vulnerabilidad ponderada» es la media de los scores ocupacionales 0-10 del dataset v15 dentro del grupo, ponderada por el empleo de cada ocupación. AIOE-CNO está en escala 0-1.

### 3.1. Correlación lineal y de rangos

La correlación de Pearson entre los diez valores AIOE-CNO de Funcas y los diez valores de vulnerabilidad ponderada del dataset v15 es **r = 0.936**. La correlación de rangos de Spearman, como verificación de robustez, es **ρ = 0.830**. Ambas métricas indican una convergencia muy alta entre las dos clasificaciones.

### 3.2. Interpretación

La convergencia r = 0,936 entre dos metodologías independientes es informativa por dos razones. Primero, ninguno de los dos modelos depende de la calibración del otro: el AIOE se construye sobre la matriz O*NET y el índice AAAI; el dataset v15 se construye mediante puntuación per-ocupación con validación adversarial entre siete modelos de IA generativa, sin referencia al AIOE. Segundo, los dos modelos parten de marcos conceptuales distintos. Que dos rutas de cálculo no superpuestas converjan es una forma débil pero real de validación mutua.

## 4. Descomposición a 4 dígitos de los grupos con destrucción flagueada

### 4.1. Grupo 2 — Técnicos y profesionales científicos

Funcas asigna AIOE = 0,63 al conjunto del grupo y estima una destrucción central de 906.000 empleos. El dataset v15 cubre 4.618.700 trabajadores en 120 ocupaciones. De ellos, **542.223** trabajadores (11.7% del grupo) puntúan ≥7 en 15 ocupaciones específicas.

| CNO | Ocupación | Empleo | Score | Salario€ |
|---|---|---|---|---|
| 2511 | Abogados | 182.954 | 7.5 | 42.744 |
| 2713 | Analistas, programadores y diseñadores Web y multimedia | 118.243 | 8.5 | 46.630 |
| 2599 | Profesionales del derecho no clasificados bajo otros epígrafes | 80.965 | 8.0 | 38.858 |
| 2712 | Analistas y diseñadores de software | 40.846 | 8.5 | 46.630 |
| 2484 | Diseñadores gráficos y multimedia | 38.937 | 8.5 | 31.086 |
| 2729 | Especialistas en bases de datos y en redes informáticas no clasificados bajo otros epígrafes | 32.169 | 7.5 | 44.687 |
| 2719 | Analistas y diseñadores de software y multimedia no clasificados bajo otros epígrafes | 25.733 | 8.5 | 46.630 |
| 2721 | Diseñadores y administradores de bases de datos | 6.864 | 7.5 | 44.687 |
| 2923 | Filólogos, intérpretes y traductores | 5.085 | 7.5 | 33.561 |
| 2416 | Estadísticos | 3.319 | 8.0 | 42.744 |
| 2415 | Matemáticos y actuarios | 2.927 | 7.0 | 44.687 |
| 2512 | Fiscales | 2.355 | 7.5 | 58.287 |
| 2591 | Notarios y registradores | 904 | 7.5 | 66.059 |
| 2592 | Procuradores | 466 | 7.5 | 34.972 |
| 2412 | Meteorólogos | 456 | 7.5 | 40.801 |

### 4.2. Grupo 3 — Técnicos y profesionales de apoyo

Funcas asigna AIOE = 0,55 y estima una destrucción central de 527.000 empleos. El dataset v15 cubre 2.685.200 trabajadores en 98 ocupaciones. De ellos, **1.165.519** trabajadores (43.4% del grupo) puntúan ≥7 en 22 ocupaciones específicas.

| CNO | Ocupación | Empleo | Score | Salario€ |
|---|---|---|---|---|
| 3510 | Agentes y representantes comerciales | 224.999 | 7.5 | 31.581 |
| 3811 | Técnicos en operaciones de sistemas informáticos | 175.027 | 7.5 | 31.581 |
| 3534 | Agentes y administradores de la propiedad inmobiliaria | 117.771 | 7.5 | 34.905 |
| 3532 | Organizadores de conferencias y eventos | 116.948 | 7.5 | 31.581 |
| 3522 | Agentes de compras | 107.489 | 7.5 | 33.243 |
| 3820 | Programadores informáticos | 75.403 | 7.5 | 36.567 |
| 3831 | Técnicos de grabación audiovisual | 71.350 | 7.5 | 29.919 |
| 3812 | Técnicos en asistencia al usuario de tecnologías de la información | 56.613 | 7.5 | 31.581 |
| 3521 | Mediadores y agentes de seguros | 54.118 | 7.5 | 31.581 |
| 3404 | Profesionales de apoyo en servicios estadísticos, matemáticos y afines | 38.401 | 7.0 | 31.581 |

### 4.3. Grupo 4 — Empleados contables y administrativos

Funcas asigna AIOE = 0,60 y estima una destrucción central de 417.000 empleos. El dataset v15 cubre 2.132.500 trabajadores en 26 ocupaciones. De ellos, **1.039.883** trabajadores (**48.8% del grupo**) puntúan ≥7 en 9 ocupaciones específicas. La ocupación con mayor empleo expuesto, *Empleados administrativos sin tareas de atención al público no clasificados bajo otros epígrafes* (CNO 4309), agrupa 444.905 trabajadores con score 8.0. Esta única ocupación es la de mayor masa vulnerable de toda la economía española en el dataset v15.

| CNO | Ocupación | Empleo | Score | Salario€ |
|---|---|---|---|---|
| 4309 | Empleados administrativos sin tareas de atención al público no clasificados bajo otros epígrafes | 444.905 | 8.0 | 25.896 |
| 4113 | Empleados de oficina de servicios estadísticos, financieros y bancarios | 176.675 | 7.5 | 30.963 |
| 4111 | Empleados de contabilidad | 139.807 | 8.0 | 25.896 |
| 4424 | Teleoperadores | 137.169 | 8.0 | 21.955 |
| 4112 | Empleados de control de personal y nóminas | 50.364 | 7.5 | 28.148 |
| 4301 | Grabadores de datos | 49.318 | 9.0 | 23.081 |
| 4423 | Telefonistas | 24.636 | 8.0 | 25.896 |
| 4421 | Empleados de agencias de viajes | 16.755 | 7.0 | 25.896 |
| 4222 | Codificadores y correctores de imprenta | 254 | 8.0 | 25.896 |

### 4.4. Grupo 1 — Directores y gerentes (divergencia informativa)

Funcas asigna AIOE = 0,52 y estima una destrucción central de 150.000 empleos. El dataset v15 cubre 939.800 trabajadores en 33 ocupaciones directivas, y **ninguna ocupación específica de directivos alcanza el umbral de vulnerabilidad ≥7**. La vulnerabilidad ponderada por empleo del grupo es 4.82.

La divergencia es defendible y merece ser explicitada. El AIOE mide exposición de habilidades a las capacidades de la IA generativa: las tareas de un director —análisis estratégico, redacción de informes, comunicación ejecutiva— son tareas en las que la IA puede operar con alto grado de capacidad. El modelo de v15 distingue entre exposición técnica y vulnerabilidad ocupacional neta: el trabajo directivo está caracterizado por una proporción alta de tareas de juicio, responsabilidad legal-corporativa e interacción interpersonal no delegables. La interpretación consistente sería: la IA tendrá un efecto sustancial de aumentación sobre el trabajo directivo, en lugar de un efecto de sustitución.

## 5. Discusión

### 5.1. Convergencia macro y divergencia granular

Los resultados de la sección 3 establecen convergencia r = 0,936 al nivel macro. Los resultados de la sección 4 establecen divergencia significativa al nivel intra-grupo. La interpretación coherente es que el ordenamiento general de la exposición ocupacional a la IA en España no depende críticamente de las decisiones metodológicas particulares de ningún modelo, pero la composición específica de la masa vulnerable dentro de cada grupo sí depende de la granularidad del análisis.

### 5.2. Complementariedad, no redundancia

El estudio Funcas y el dataset v15 responden a preguntas distintas y son complementarios. Funcas pregunta: ¿cuántos empleos esperaríamos que se destruyan brutamente, desagregados a 9 grandes grupos? v15 pregunta: ¿cuál es el techo teórico de vulnerabilidad de cada una de las 502 ocupaciones específicas? Las dos preguntas son legítimas y combinadas ofrecen una imagen más completa que cualquiera por separado.

### 5.3. Limitaciones de la validación cruzada

Las limitaciones se enuncian explícitamente. Primero, la comparación opera a través de una transformación implícita: el AIOE (0-1) y la vulnerabilidad de v15 (0-10) miden conceptos relacionados pero no idénticos, y la correlación capta convergencia en ordenamiento, no equivalencia absoluta. Segundo, el dataset v15 reasigna el empleo nacional al cuarto dígito mediante una cascada (EPA → Censo → SEPE) que introduce error de medición no presente en los agregados directos del INE utilizados por Funcas. Tercero, ambos modelos podrían estar sistemáticamente sesgados en la misma dirección por razones distintas; la existencia de un tercer modelo independiente permitiría triangular.

### 5.4. Implicaciones para la lectura del debate público

La cifra de 2,3 millones de empleos destruidos en diez años (Funcas) y la cifra de 12,1% de la fuerza laboral con vulnerabilidad ≥7 del dataset v15 (≈2,75 millones) son métricas distintas que conviven en niveles de magnitud comparables. La primera es destrucción esperada bajo escenarios temporales explícitos; la segunda es techo teórico de exposición sin asunción de velocidad de adopción. La lectura más útil del debate público es probablemente la conjunción de ambas.

## 6. Conclusiones

**Primero**, la correlación de Pearson entre los valores AIOE-CNO publicados por Funcas y la vulnerabilidad media ponderada por empleo del dataset v15, agregada al nivel de los nueve grandes grupos CNO-11, es **r = 0.936**. Dos metodologías independientes con inputs disjuntos convergen al nivel macro.

**Segundo**, la descomposición del dataset v15 a cuatro dígitos abre dentro de cada gran grupo la heterogeneidad ocupacional que la agregación a un dígito no puede capturar. Las concentraciones específicas de vulnerabilidad ≥7 dentro de los cuatro grupos flagueados por Funcas son: 542.223 trabajadores en el grupo 2 (15 ocupaciones), 1.165.519 en el grupo 3 (22 ocupaciones), 1.039.883 en el grupo 4 (9 ocupaciones) y 0 en el grupo 1.

**Tercero**, la divergencia entre los dos modelos en el grupo 1 (Directores y gerentes) es informativa más que problemática. Refleja la distinción metodológica entre exposición técnica de tareas y vulnerabilidad ocupacional neta.

**Cuarto**, los dos modelos son complementarios, no redundantes. El estudio Funcas proporciona el marco macroeconómico de horizonte y escenarios; el dataset v15 proporciona la capa ocupacional a 4 dígitos y la masa salarial vulnerable.

## Referencias

- Acemoglu, D. (2024). The simple macroeconomics of AI. *NBER Working Paper* 32487. Publicado en *Economic Policy*, 40(121), 13–58 (2025). https://doi.org/10.3386/w32487
- De Nicolás, Á. (2026). *IA y Empleo en España: vulnerabilidad ocupacional, masa salarial vulnerable y validación adversarial sobre 502 ocupaciones CNO-11*. Anlak Studio. Metodología v30 / Dataset v14. Zenodo. https://doi.org/10.5281/zenodo.19186444
- Eloundou, T., Manning, S., Mishkin, P. y Rock, D. (2024). GPTs are GPTs: Labor market impact potential of LLMs. *Science*, 384(6702), 1306–1308. https://doi.org/10.1126/science.adj0998
- Felten, E. W., Raj, M. y Seamans, R. (2023). Occupational heterogeneity in exposure to generative AI. *SSRN Working Paper* 4414065. Dataset: github.com/AIOE-Data/AIOE
- Rodríguez-Fernández, F. (2026). *Inteligencia artificial y mercado de trabajo en España. Exposición ocupacional, efectos sobre el empleo y adopción empresarial*. Funcas, Documento de Trabajo, abril 2026.
- INE (2026). *Encuesta de Población Activa, 4T2025*. INE, 27 de enero de 2026.
- INE (2025). *Encuesta sobre el uso de TIC y del comercio electrónico en las empresas (ETICCE), 1T2025*. INE, 22 de octubre de 2025.

---

**Sugerencia de citación de esta nota:** De Nicolás, Á. (2026). *Validación cruzada del dataset «IA y Empleo en España» (v15) con el estudio Funcas DT-2026/04 (Rodríguez-Fernández, abril 2026): nota metodológica complementaria*. Anlak Studio. Zenodo. [DOI por asignar tras depósito; concept DOI: 10.5281/zenodo.19076797]
