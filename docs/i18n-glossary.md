# FreeCrawl SEO — UI Translation Glossary

The interface ships in 11 languages. At roughly 2,400 strings per locale, the
biggest quality risk is not mistranslation but **inconsistency** — "crawl"
rendered three different ways inside one language makes the product read as
machine-translated. This file is the reference every locale is written
against.

Scope: the terms below recur across the whole UI (sidebar, column headers,
settings, dialogs, reports). One-off phrasing is left to the translator's
judgement.

---

## 1. Terms kept in English in every locale

These are protocol names, file names, standards, and metric acronyms. They are
what the user searches the web for, and translating them makes the UI *harder*
to use, not easier.

`robots.txt` · `sitemap.xml` · `hreflang` · `canonical` (as the `rel=canonical`
token) · `HTTP` · `HTTPS` · `TLS` · `SSL` · `HSTS` · `CSP` · `JSON-LD` ·
`microdata` · `RDFa` · `OpenGraph` · `AMP` · `SERP` · `User-Agent` ·
`Accept-Language` · `Set-Cookie` · `SameSite` · `HttpOnly` · `Secure` ·
`nofollow` · `noindex` · `rel=next` / `rel=prev` · `SimHash` · `Hamming` ·
`PageRank` · `LCP` · `CLS` · `INP` · `FCP` · `TBT` · `TTI` · `TTFB` ·
`CrUX` · `PageSpeed Insights` · `Search Console` · `GA4` · `MCP` ·
`CSV` · `XLSX` · `XML` · `PNG` · `SQLite` · `regex` · `XPath` · `JSONPath` ·
`CSS` (as selector language) · `DOM` · `SPA` · `CDN` · `WAF` · `RPS` ·
`rDNS` · `IP` · `URL` · `SEO`

Product and vendor names are never translated: `FreeCrawl SEO`, `Screaming
Frog`, `Google`, `Googlebot`, `Chromium`, `Playwright`, `LanguageTool`,
`Apache`, `Nginx`, `IIS`, `Slack`, `Zapier`, `Discord`, `OpenAI`, `Anthropic`,
`Ollama`, `BigQuery`, `Excel`.

Also untranslated in every locale, by existing policy: regexes, CSS selectors,
XPath expressions, example URLs, HTTP header names and values, and sample cell
values (`200, 301, 404, 500`).

---

## 2. Core vocabulary

`—` means "keep the English word". Where two forms are listed, the first is the
noun and the second the verb.

| English | es | pt-BR | fr | it | ru | tr | az | zh-CN | ko | hi |
|---|---|---|---|---|---|---|---|---|---|---|
| crawl (noun) | rastreo | rastreamento | exploration | scansione | обход | tarama | tarama | 抓取 | 크롤 | क्रॉल |
| crawl (verb) | rastrear | rastrear | explorer | scansionare | обходить | taramak | taramaq | 抓取 | 크롤링하다 | क्रॉल करना |
| crawler | rastreador | rastreador | robot d'exploration | crawler | краулер | tarayıcı | tarayıcı | 抓取器 | 크롤러 | क्रॉलर |
| spider (mode) | Spider | Spider | Spider | Spider | Spider | Spider | Spider | Spider | Spider | Spider |
| URL | URL | URL | URL | URL | URL | URL | URL | URL | URL | URL |
| link | enlace | link | lien | link | ссылка | bağlantı | keçid | 链接 | 링크 | लिंक |
| inlinks | enlaces entrantes | links de entrada | liens entrants | link in entrata | входящие ссылки | gelen bağlantılar | daxil olan keçidlər | 入链 | 인바운드 링크 | इनलिंक |
| outlinks | enlaces salientes | links de saída | liens sortants | link in uscita | исходящие ссылки | giden bağlantılar | çıxan keçidlər | 出链 | 아웃바운드 링크 | आउटलिंक |
| indexability | indexabilidad | indexabilidade | indexabilité | indicizzabilità | индексируемость | indekslenebilirlik | indekslənə bilmə | 可索引性 | 색인 가능성 | अनुक्रमणीयता |
| indexable | indexable | indexável | indexable | indicizzabile | индексируемый | indekslenebilir | indekslənə bilən | 可索引 | 색인 가능 | अनुक्रमणीय |
| orphan (page) | huérfana | órfã | orpheline | orfana | осиротевшая | yetim | yetim | 孤立页面 | 고립 페이지 | अनाथ पृष्ठ |
| redirect | redirección | redirecionamento | redirection | reindirizzamento | перенаправление | yönlendirme | yönləndirmə | 重定向 | 리다이렉트 | रीडायरेक्ट |
| redirect chain | cadena de redirecciones | cadeia de redirecionamentos | chaîne de redirections | catena di reindirizzamenti | цепочка перенаправлений | yönlendirme zinciri | yönləndirmə zənciri | 重定向链 | 리다이렉트 체인 | रीडायरेक्ट शृंखला |
| response code | código de respuesta | código de resposta | code de réponse | codice di risposta | код ответа | yanıt kodu | cavab kodu | 响应代码 | 응답 코드 | प्रतिक्रिया कोड |
| status | estado | status | statut | stato | статус | durum | status | 状态 | 상태 | स्थिति |
| depth (crawl) | profundidad | profundidade | profondeur | profondità | глубина | derinlik | dərinlik | 深度 | 깊이 | गहराई |
| word count | número de palabras | contagem de palavras | nombre de mots | conteggio parole | количество слов | kelime sayısı | söz sayı | 字数 | 단어 수 | शब्द गणना |
| near-duplicate | casi duplicado | quase duplicado | quasi-doublon | quasi-duplicato | почти дубликат | yakın yinelenen | yaxın dublikat | 近似重复 | 유사 중복 | निकट-प्रतिलिपि |
| duplicate | duplicado | duplicado | doublon | duplicato | дубликат | yinelenen | dublikat | 重复 | 중복 | प्रतिलिपि |
| sitemap | sitemap | sitemap | sitemap | sitemap | sitemap | sitemap | sitemap | 站点地图 | 사이트맵 | साइटमैप |
| render / rendering | renderizado | renderização | rendu | rendering | рендеринг | render | render | 渲染 | 렌더링 | रेंडरिंग |
| viewport | viewport | viewport | fenêtre d'affichage | viewport | область просмотра | görüntü alanı | görüntü sahəsi | 视口 | 뷰포트 | व्यूपोर्ट |
| issue | problema | problema | problème | problema | проблема | sorun | problem | 问题 | 문제 | समस्या |
| warning | advertencia | aviso | avertissement | avviso | предупреждение | uyarı | xəbərdarlıq | 警告 | 경고 | चेतावनी |
| error | error | erro | erreur | errore | ошибка | hata | xəta | 错误 | 오류 | त्रुटि |
| finding | hallazgo | constatação | constatation | rilievo | замечание | bulgu | tapıntı | 发现项 | 발견 항목 | निष्कर्ष |
| export (verb) | exportar | exportar | exporter | esportare | экспортировать | dışa aktarmak | ixrac etmək | 导出 | 내보내기 | निर्यात करना |
| overview | resumen general | visão geral | vue d'ensemble | panoramica | обзор | genel bakış | ümumi baxış | 概览 | 개요 | अवलोकन |
| summary | resumen | resumo | résumé | riepilogo | сводка | özet | xülasə | 摘要 | 요약 | सारांश |
| budget (performance) | presupuesto | orçamento | budget | budget | бюджет | bütçe | büdcə | 预算 | 예산 | बजट |
| throttle / rate limit | límite de velocidad | limite de taxa | limitation de débit | limite di velocità | ограничение скорости | hız sınırı | sürət limiti | 速率限制 | 속도 제한 | दर सीमा |
| queue | cola | fila | file d'attente | coda | очередь | kuyruk | növbə | 队列 | 큐 | कतार |
| snapshot | instantánea | snapshot | instantané | snapshot | снимок | anlık görüntü | anlıq görüntü | 快照 | 스냅샷 | स्नैपशॉट |
| project | proyecto | projeto | projet | progetto | проект | proje | layihə | 项目 | 프로젝트 | प्रोजेक्ट |
| extraction rule | regla de extracción | regra de extração | règle d'extraction | regola di estrazione | правило извлечения | çıkarım kuralı | çıxarış qaydası | 提取规则 | 추출 규칙 | निष्कर्षण नियम |
| settings | ajustes | configurações | paramètres | impostazioni | настройки | ayarlar | parametrlər | 设置 | 설정 | सेटिंग्स |
| column | columna | coluna | colonne | colonna | столбец | kolon | sütun | 列 | 열 | स्तंभ |
| row | fila | linha | ligne | riga | строка | satır | sətir | 行 | 행 | पंक्ति |
| tab | pestaña | aba | onglet | scheda | вкладка | sekme | tab | 标签页 | 탭 | टैब |
| report | informe | relatório | rapport | report | отчёт | rapor | hesabat | 报告 | 보고서 | रिपोर्ट |
| bot | bot | bot | bot | bot | бот | bot | bot | 机器人 | 봇 | बॉट |
| threat / suspicious request | solicitud sospechosa | solicitação suspeita | requête suspecte | richiesta sospetta | подозрительный запрос | şüpheli istek | şübhəli sorğu | 可疑请求 | 의심스러운 요청 | संदिग्ध अनुरोध |

---

## 3. Style rules per locale

- **es / pt-BR / fr / it** — use the infinitive for button labels and menu
  actions (`Exportar`, `Exporter`, `Esportare` → but prefer the established
  UI convention: `Exportar` / `Exporter` / `Esporta`). Address the user with
  the formal/impersonal register; avoid `tú` / `tu` imperatives in help text.
- **ru** — button labels are imperative verbs or verbal nouns
  (`Экспорт`, `Остановить`). Respect the three plural forms
  (`_one` / `_few` / `_many` / `_other`).
- **tr / az** — button labels are verbal nouns (`Dışa Aktar`, `Durdur`).
  Neither language inflects a noun after a numeral, so both plural categories
  carry identical text. **Azerbaijani is not Turkish**: prefer native forms
  (`keçid` not `bağlantı`, `sorğu` not `istek`, `parametrlər` not `ayarlar`)
  and watch for false friends.
- **zh-CN** — Simplified characters, no spaces around CJK text, full-width
  punctuation (，。：) inside prose but keep ASCII punctuation around Latin
  tokens and in technical strings. One plural category only (`_other`).
- **ko** — use `-기` verbal nouns for buttons (`내보내기`, `저장하기` → prefer
  the shorter `저장`). Formal `-습니다` register in prose. One plural
  category only (`_other`).
- **hi** — Devanagari. Keep widely-used English loanwords in Latin script when
  that is what practitioners actually write (`URL`, `SEO`, `क्रॉल`). Two
  plural categories (`_one` / `_other`).

---

## 4. Plural categories by locale

i18next selects the form via `Intl.PluralRules`, so each locale must supply
exactly the categories CLDR defines for it. Verified against Node's ICU
rather than from memory — several of these are counter-intuitive:

| Locale | Categories | Notes |
|---|---|---|
| en, tr, az | `_one`, `_other` | 0 → `other` |
| hi | `_one`, `_other` | **0 → `one`** ("0 पृष्ठ", singular) |
| es, it | `_one`, `_many`, `_other` | 0 → `other`; `_many` fires at 10⁶ |
| fr, pt-BR | `_one`, `_many`, `_other` | **0 → `one`**; `_many` at 10⁶ |
| ru | `_one`, `_few`, `_many`, `_other` | 1/21/31 → `one`; 2–4/22–24 → `few`; 0/5–20 → `many`; fractions → `other` |
| zh-CN, ko | `_other` | no grammatical number |

Two consequences worth remembering:

- **`_many` is not "a lot of"** in the Romance locales — it fires only from
  1,000,000, where Spanish and Portuguese insert `de` ("1.000.000 **de** URL").
  Omitting it falls back to `_other`, which is merely slightly wrong at that
  scale, not broken.
- **Russian `_other` is for non-integers only.** The form a Russian user
  actually sees for 0 and for 5–20 is `_many`, so `_many` must read naturally
  — it is the most common form in practice, not an edge case.

A missing category falls back to `_other`; a category CLDR does not define for
a locale is dead weight and is never selected.
