/**
 * Brazilian Portuguese integration setup guides. Generated from the guide source —
 * see `./index.ts` for how a locale is picked. Keep the step count,
 * links and `lastReviewed` in lockstep with `en.ts`; the parity test
 * in `tests/` compares them.
 */
import type { Guide } from './types.js';

export const GUIDES_PT_BR: Record<string, Guide> = {
  openai: {
    intro:
      'Execute um prompt personalizado por URL pela API da OpenAI — análise de conteúdo, ideias de título, resumos. O uso é cobrado na sua própria conta OpenAI; o FreeCrawl é um intermediário gratuito, as chamadas de API saem do seu bolso.',
    prereqs: [
      'Conta OpenAI (cadastre-se grátis em https://platform.openai.com).',
      'Forma de pagamento válida — a OpenAI exige um saldo mínimo de US$ 5 antes de as chaves funcionarem.',
    ],
    steps: [
      {
        title: 'Entre em platform.openai.com',
        detail: 'Use sua conta OpenAI. Se ainda não tiver uma, "Sign up".',
        link: {
          label: 'platform.openai.com',
          url: 'https://platform.openai.com',
        },
      },
      {
        title: 'Clique em "API keys" na barra lateral esquerda',
        detail: 'Item de menu com ícone de chave à esquerda. Você também pode ir direto pela URL.',
        link: {
          label: 'Página API keys',
          url: 'https://platform.openai.com/api-keys',
        },
      },
      {
        title: 'Clique em "+ Create new secret key" (canto superior direito)',
        detail:
          'No diálogo:\n• Name: "FreeCrawl SEO Tool" (qualquer rótulo lembrete)\n• Project: Default project ou o que preferir\n• Permissions: All (mais fácil; escopos restritos também funcionam)\ndepois "Create secret key".',
      },
      {
        title: 'COPIE a chave — ela nunca mais será exibida',
        detail:
          'A chave começa com `sk-...`. Se não copiar agora, você a perde para sempre (teria de criar outra). Guarde num gerenciador de senhas — não deixe numa aba do navegador.',
      },
      {
        title: 'Cole no campo "API Key" deste painel + clique em Salvar',
        detail:
          'O FreeCrawl guarda a chave criptografada no cofre de credenciais do sistema (Windows DPAPI, Keychain do macOS, Secret Service do Linux). Nunca gravada em texto puro.',
      },
      {
        title: 'Teste na aba AI',
        detail:
          'Feche as Configurações → vá para a aba superior "AI" → escolha algumas URLs de um rastreamento → clique em "Run AI". A primeira chamada leva ~2-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"You exceeded your current quota"',
        solution:
          'Sua conta OpenAI está sem saldo. Vá em platform.openai.com → Billing → "Add payment method" → adicione um cartão e carregue US$ 5 ou mais. Contas novas não recebem crédito automático; é preciso recarregar.',
      },
      {
        problem: '"Incorrect API key provided" / 401',
        solution:
          'A chave provavelmente tem um espaço perdido no início ou no fim. Gere uma nova e copie com cuidado. Revogue a antiga.',
      },
      {
        problem: '"Rate limit exceeded"',
        solution:
          'Requisições paralelas demais. Reduza a concorrência em Configurações → AI (padrão: 3). Contas Tier 1 rodam a 500-3500 RPM dependendo do modelo.',
      },
    ],
    notes: [
      'Preços (2026-06): gpt-4o-mini ~US$ 0,15/1M tokens de entrada, gpt-4o ~US$ 2,50/1M de entrada. 1000 URLs com prompt + resposta típicos: ~US$ 0,50-2.',
      'Defina um limite mensal rígido na página Usage limits — você não quer um rastreamento descontrolado de 1M de URLs gerando uma conta de US$ 1000.',
    ],
    lastReviewed: '2026-06-01',
  },
  anthropic: {
    intro:
      'Execute prompts no Claude pela API da Anthropic. Os modelos de ponta do Claude (Sonnet 4.6, Opus 4.8) produzem um resultado SEO com menos "cara de IA" que os concorrentes. Cobrado na sua própria conta Anthropic.',
    prereqs: [
      'Conta Anthropic (https://console.anthropic.com).',
      'Forma de pagamento cadastrada (usuários novos ganham US$ 5 de crédito promocional).',
    ],
    steps: [
      {
        title: 'Entre em console.anthropic.com',
        link: {
          label: 'console.anthropic.com',
          url: 'https://console.anthropic.com',
        },
      },
      {
        title: 'Abra a página "API Keys" pelo menu suspenso no canto superior direito',
        detail: 'No menu Settings, entrada "API Keys".',
        link: {
          label: 'Página API Keys',
          url: 'https://console.anthropic.com/settings/keys',
        },
      },
      {
        title: 'Clique em "+ Create Key"',
        detail:
          'No diálogo:\n• Name: "FreeCrawl SEO Tool"\n• Workspace: Default workspace\n• Environment: Production\ndepois "Create Key".',
      },
      {
        title: 'COPIE a chave — ela nunca mais será exibida',
        detail: 'A chave começa com `sk-ant-...`. Perdeu? Crie outra.',
      },
      {
        title: 'Cole no campo "API Key" + Salvar',
      },
      {
        title: 'Opcional: escolha um modelo',
        detail:
          'Em Configurações → AI, o campo "Model" aceita um id de modelo (padrão: claude-sonnet-4-6). Prioridade em velocidade: claude-haiku-4-5 (~10x mais barato, 3x mais rápido). Prioridade em qualidade: claude-opus-4-8.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Your credit balance is too low"',
        solution: 'console.anthropic.com → Settings → Billing → "Add credits" — mínimo US$ 5.',
      },
      {
        problem: '"Number of request tokens has exceeded your rate limit"',
        solution:
          'Contas Tier 1 rodam a ~50 RPM. Reduza a concorrência para 2-3 em Configurações → AI. Para tiers maiores é preciso ter gasto US$ 25 ou mais (Tier 2: 1000 RPM).',
      },
      {
        problem: '"Invalid API key"',
        solution:
          'Confira se o prefixo "sk-ant-" está intacto e não há espaços perdidos. Verifique a página API Keys — se a chave aparece como ativa lá, a chave em si está ok.',
      },
    ],
    notes: [
      'Preços (2026-06): Haiku 4.5 ~US$ 0,25/1,25 (entrada/saída por 1M tokens), Sonnet 4.6 ~US$ 3/15, Opus 4.8 ~US$ 15/75.',
      'A Anthropic suporta cache de prompts — system prompts longos repetidos em 5 min têm 90% de desconto (o painel AI do FreeCrawl ainda não usa cache — virá numa versão futura).',
    ],
    lastReviewed: '2026-06-01',
  },
  ollama: {
    intro:
      'Ollama é um runtime open source para LLMs hospedados localmente. SEM chave de API, grátis para sempre, nem precisa de internet. Custo zero; a única desvantagem é VRAM/RAM para modelos maiores.',
    prereqs: [
      'macOS 12+, Windows 10+ ou Linux (Ubuntu 22.04+ recomendado).',
      'Pelo menos 8 GB de RAM (modelos menores). Llama 3.2 3B precisa de ~2 GB de VRAM/RAM.',
      'GPU recomendada, mas não obrigatória — CPU funciona (mais lento).',
    ],
    steps: [
      {
        title: 'Baixe + instale o Ollama',
        detail:
          'Escolha o instalador do seu sistema:\n• Windows: OllamaSetup.exe\n• macOS: Ollama.dmg\n• Linux: curl -fsSL https://ollama.com/install.sh | sh\n\nApós a instalação o Ollama roda em segundo plano (ícone na bandeja do sistema).',
        link: {
          label: 'ollama.com/download',
          url: 'https://ollama.com/download',
        },
      },
      {
        title: 'Baixe um modelo',
        detail:
          'Abra um terminal e rode:\n\n  ollama pull llama3.2\n\nllama3.2 (3B parâmetros) tem ~2GB, é rápido e leve. Opções maiores:\n  ollama pull llama3.3:70b   (~40GB, só GPU parruda)\n  ollama pull qwen2.5:7b     (~4GB, equilibrado)\n  ollama pull mistral:7b     (~4GB, alternativa)',
      },
      {
        title: 'Teste rápido do modelo',
        detail:
          'No terminal:\n  ollama run llama3.2\n\nUm chat interativo abre. Digite "hello" — se receber resposta, está tudo certo. Ctrl+D para sair.',
      },
      {
        title: 'Informe o endpoint do Ollama neste painel',
        detail:
          'Padrão: http://localhost:11434 (já preenchido). Altere se o Ollama rodar em outra porta.',
      },
      {
        title: 'Informe o nome do modelo que você baixou',
        detail:
          'Ex.: "llama3.2" ou "qwen2.5:7b". Deixe em branco para o FreeCrawl escolher o primeiro modelo disponível.',
      },
      {
        title: 'Salve + teste',
        detail: 'Rode um lote pequeno na aba AI. Só CPU: ~5-15 s/URL. GPU: ~1-3 s.',
      },
    ],
    troubleshooting: [
      {
        problem: 'AI tab says "Connection refused"',
        solution:
          'O Ollama não está rodando. No terminal rode "ollama serve" ou abra o app Ollama pela bandeja do sistema / menu Iniciar.',
      },
      {
        problem: '"model \'X\' not found"',
        solution:
          'Modelo não baixado. Rode "ollama pull <nome-do-modelo>". Use "ollama list" para ver o que já está no disco.',
      },
      {
        problem: 'Replies are very slow (>30 s/URL)',
        solution:
          'O modelo não cabe na VRAM e cai para a CPU. Tente um modelo menor (llama3.2:1b ou phi3:mini). Necessidade de VRAM: 3B ~2GB, 7B ~4GB, 13B ~8GB.',
      },
    ],
    notes: [
      'Totalmente offline — rastreamento + análise de IA continuam rodando mesmo sem internet.',
      'Qualidade da análise SEO local: modelos 3B um pouco fracos, 7-13B decentes, 70B no nível do GPT-4 (mas hardware pesado).',
      'Em Configurações → AI mantenha a concorrência em 1-2 — modelos locais serializam requisições paralelas.',
    ],
    lastReviewed: '2026-06-01',
  },
  pagespeed: {
    intro:
      'O Google PageSpeed Insights audita cada URL com o Lighthouse e retorna pontuações de Desempenho/SEO/Acessibilidade/Boas práticas + Core Web Vitals (LCP/CLS/INP). Uma chave de API gratuita dá 25.000 auditorias/dia.',
    prereqs: [
      'Conta Google.',
      'Projeto no Google Cloud Console (você pode criar um nos passos abaixo).',
    ],
    steps: [
      {
        title: 'Abra o Google Cloud Console',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Escolha ou crie um projeto',
        detail:
          'Menu suspenso de projeto no canto superior esquerdo → "New Project" → nome: "FreeCrawl SEO" → Create. NÃO precisa de conta de faturamento — o nível gratuito do PSI só precisa de credenciais para autenticação.',
      },
      {
        title: 'Ative a PageSpeed Insights API',
        detail: 'Este link leva direto à página de ativação da API:',
        link: {
          label: 'PageSpeed Insights API → Enable',
          url: 'https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com',
        },
      },
      {
        title: 'Clique no botão azul "Enable" → aguarde 30 s',
      },
      {
        title: 'Vá em Credentials',
        link: {
          label: 'Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Clique em "+ Create Credentials" → "API key"',
        detail: 'Uma chave de API é gerada (começa com `AIzaSy...`). Copie imediatamente.',
      },
      {
        title: 'Opcional: restrinja a chave de API (recomendado)',
        detail:
          'Clique em "Edit API key" → "Restrict key":\n• API restrictions: "Restrict key" → "PageSpeed Insights API"\n• Application restrictions: "None" (o FreeCrawl é um app desktop, então filtro por referrer/IP não funciona)\nChaves sem restrição também funcionam, mas recomendamos restringir.',
      },
      {
        title: 'Cole a chave no campo "API Key" deste painel + Salvar',
      },
      {
        title: 'Teste na aba PageSpeed',
        detail:
          'Aba superior "PageSpeed" → escolha algumas URLs → "Run audit". A primeira auditoria leva ~10-15 s.',
      },
    ],
    troubleshooting: [
      {
        problem: '"This API method requires billing to be enabled"',
        solution:
          'Você ativou a API errada (ex.: uma antiga "Cloud PageSpeed Insights API"). A correta é "PageSpeed Insights API" (pagespeedonline.googleapis.com). Abra de novo o link do passo 3.',
      },
      {
        problem: '"API key not valid"',
        solution:
          'As restrições da chave estão erradas. Cloud Console → Credentials → clique na chave → confira se "PageSpeed Insights API" está entre as APIs permitidas. Ou remova as restrições temporariamente para verificar.',
      },
      {
        problem: '"Quota exceeded" — before hitting 25,000',
        solution:
          'Há também um limite por minuto: 240 consultas/min. Em Configurações → PageSpeed mantenha a concorrência em 2-3. O teto diário de 25K é altíssimo — você não vai vê-lo em uso normal.',
      },
    ],
    notes: [
      'Custo: GRÁTIS — uma das poucas APIs do Google que não exige faturamento. O modo sem chave/anônimo agora é 0 consultas/dia (encerrado no início de 2026), então a chave é obrigatória.',
      'Velocidade: cada URL ~5-10 s (o Google realmente roda uma instância do Lighthouse). 1000 URLs ~2 horas.',
      'Mobile + Desktop contam como chamadas de API separadas — escolher "ambos" dobra o consumo de cota.',
    ],
    lastReviewed: '2026-06-01',
  },
  ahrefs: {
    intro:
      'Obtenha contagem de backlinks, domain rating, domínios de referência e contagem de palavras-chave orgânicas por URL pela API do Ahrefs. É a integração mais cara do Ahrefs — o acesso à API fica atrás de planos de US$ 500+/mês.',
    prereqs: [
      'Assinatura Ahrefs Standard (US$ 249/mês) ou superior.',
      'Nível adicional "API" (US$ 500/mês a mais sobre o plano base, ou outro nível).',
    ],
    steps: [
      {
        title: 'Entre no Ahrefs → página API',
        link: {
          label: 'ahrefs.com/api',
          url: 'https://ahrefs.com/api',
        },
      },
      {
        title: 'Escolha uma assinatura (se ainda não tiver acesso à API)',
        detail:
          'O acesso à API v3 vem com o nível Enterprise e planos de API dedicados. Fale com vendas para um orçamento.',
      },
      {
        title: 'Gere um token de API na sua conta',
        detail:
          'Painel do Ahrefs → Account settings → API → Generate token. Formato do token: `sk-...` ou semelhante.',
      },
      {
        title: 'Cole no campo "API Key" + Salvar',
      },
      {
        title: 'Teste na aba SEO Authority',
        detail: 'Aba superior "SEO Authority" → provedor: "Ahrefs" → escolha algumas URLs → "Run".',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient credits"',
        solution:
          'Unidades de linhas da API esgotadas. Painel do Ahrefs → API → aba "Usage". Faça upgrade do plano ou espere o próximo ciclo de cobrança.',
      },
      {
        problem: '"Unauthorized"',
        solution:
          'Sua assinatura não inclui acesso à API. "Ahrefs Standard" sozinho não dá direitos de API — é preciso um nível de API explícito por cima.',
      },
    ],
    notes: [
      'Custo: cerca de 1-5 linhas de API por auditoria de URL. Plano de API Standard ~25K linhas/mês.',
      'Alternativas mais baratas: Moz (US$ 99/mês, Domain Authority) ou Majestic.',
    ],
    lastReviewed: '2026-06-01',
  },
  majestic: {
    intro:
      'Obtenha Trust Flow, Citation Flow e contagem de backlinks pela API do Majestic. O provedor focado em backlinks com melhor custo-benefício.',
    prereqs: [
      'Assinatura Majestic Lite (US$ 49,99/mês) ou superior.',
      'Acesso à API — incluído no Lite.',
    ],
    steps: [
      {
        title: 'Abra o painel de desenvolvedor do Majestic',
        link: {
          label: 'majestic.com/account/api',
          url: 'https://majestic.com/account/api',
        },
      },
      {
        title: 'Gere uma chave de API',
        detail: 'Painel → aba "Open API" → "Generate new key" → copie.',
      },
      {
        title: 'Cole neste painel + Salvar',
      },
    ],
    troubleshooting: [
      {
        problem: '"Insufficient resources" / "No analysis units"',
        solution:
          'Cota mensal de unidades de análise esgotada. Plano Lite: 1000 unidades/mês; Pro: 20K+. Verifique o painel do Majestic → API → uso.',
      },
    ],
    notes: [
      'Custo: 1 consulta de backlinks de URL = 5 unidades. Plano Lite (1000 unidades) ~200 URLs/mês.',
    ],
    lastReviewed: '2026-06-01',
  },
  moz: {
    intro:
      'Obtenha Domain Authority (DA), Page Authority (PA) e Spam Score pela API do Moz. A escolha mais popular para orçamentos menores.',
    prereqs: [
      'Assinatura Moz Pro Standard (US$ 99/mês) ou superior com o complemento "Moz API" ativado.',
    ],
    steps: [
      {
        title: 'Abra a página da API do Moz',
        link: {
          label: 'moz.com/api',
          url: 'https://moz.com/api',
        },
      },
      {
        title: 'Account → API → "Generate Credentials"',
        detail: 'Dois valores são gerados: "Access ID" e "Secret Key". Copie os dois.',
      },
      {
        title: 'Cole cada um nos campos "Access ID" + "Secret Key" deste painel + Salvar',
        detail: 'Dois campos separados — preencha na ordem.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Authentication failed"',
        solution:
          'Access ID ou Secret Key foi copiado errado. Copie de novo do painel do Moz — o Access ID é curto (~13 caracteres), a Secret Key é longa (~40 caracteres).',
      },
    ],
    notes: [
      'Custo: plano Standard (1500 linhas/mês), Medium (10K linhas/mês), Large (100K linhas/mês).',
    ],
    lastReviewed: '2026-06-01',
  },
  semrush: {
    intro:
      'Obtenha palavras-chave orgânicas, estimativas de tráfego e recursos de SERP pela API do Semrush. Os dados de palavras-chave + tráfego mais completos.',
    prereqs: [
      'Assinatura Semrush Pro (US$ 129/mês) ou superior.',
      '"API units" vinculadas à conta (nível Guru e acima incluem acesso à API).',
    ],
    steps: [
      {
        title: 'Entre no Semrush → Subscription info → API',
        link: {
          label: 'Acesso à API do Semrush',
          url: 'https://www.semrush.com/accounts/subscription-info/api-units/',
        },
      },
      {
        title: 'Copie a chave de API',
      },
      {
        title: 'Cole neste painel + Salvar',
      },
    ],
    troubleshooting: [
      {
        problem: '"API units exhausted"',
        solution:
          'Cota mensal de unidades esgotada. Plano Guru: 7K unidades/mês, Business: 25K+. Verifique o painel do Semrush → API → uso.',
      },
    ],
    notes: [
      'Custo: 1 consulta de backlinks de URL = 10 unidades; 1 visão geral de domínio = 1 unidade.',
    ],
    lastReviewed: '2026-06-01',
  },
  gsc: {
    intro:
      'Obtenha métricas do Search Console por URL (cliques, impressões, CTR, posição média) pela API do Google Search Console. A API URL Inspection também dá o veredito de cobertura + horário do último rastreamento. Modelo "traga seu próprio cliente" — você cria seu próprio cliente OAuth no Google Cloud e cola aqui; o FreeCrawl não usa um app intermediário compartilhado.',
    prereqs: [
      'Conta Google (precisa ser proprietária / coproprietária da propriedade do GSC que você quer conectar).',
      'Pelo menos uma propriedade do Google Search Console adicionada + verificada.',
    ],
    steps: [
      {
        title: 'Abra o Google Cloud Console e crie um projeto novo',
        detail:
          'Menu suspenso de projeto no canto superior esquerdo → "New Project" → nome: "FreeCrawl SEO Integrations" (o que quiser) → Create. Este projeto serve só para credenciais OAuth — faturamento não é necessário.',
        link: {
          label: 'console.cloud.google.com',
          url: 'https://console.cloud.google.com',
        },
      },
      {
        title: 'Abra Google Auth Platform → Branding',
        detail:
          'Menu esquerdo "APIs & Services" → "OAuth consent screen" (interface nova: "Google Auth Platform → Branding"). User Type: "External" → Create.',
        link: {
          label: 'OAuth consent screen',
          url: 'https://console.cloud.google.com/auth/branding',
        },
      },
      {
        title: 'Preencha a tela de consentimento OAuth',
        detail:
          'Só os campos obrigatórios:\n• App name: "FreeCrawl Local"\n• User support email: seu e-mail\n• Developer contact information: seu e-mail\nDeixe o resto em branco. Save and Continue → Save and Continue → Save and Continue → Back to Dashboard.',
      },
      {
        title: 'CRÍTICO: adicione você mesmo como Test User',
        detail:
          'Menu esquerdo → "Audience" (interface antiga "Test users") → "Add users" → cole o Gmail que vai conectar → Save.\n\nATENÇÃO: NÃO PULE ESTE PASSO. Pular gera um 403 access_denied durante o OAuth — apps em status "Testing" só permitem conectar contas da lista de usuários de teste.',
        link: {
          label: 'Página Audience',
          url: 'https://console.cloud.google.com/auth/audience',
        },
      },
      {
        title: 'Ative a Google Search Console API',
        detail:
          'Este link vai direto para a página de ativação → clique no botão azul "Enable" → aguarde 30 s.',
        link: {
          label: 'Search Console API → Enable',
          url: 'https://console.cloud.google.com/apis/library/searchconsole.googleapis.com',
        },
      },
      {
        title: 'Crie um OAuth Client ID',
        detail:
          'Menu esquerdo → "Credentials" (interface nova "Google Auth Platform → Clients") → "+ Create credentials" → "OAuth client ID".',
        link: {
          label: 'Página Credentials',
          url: 'https://console.cloud.google.com/apis/credentials',
        },
      },
      {
        title: 'Escolha "Desktop app" como tipo de cliente OAuth (NÃO Web app!)',
        detail:
          'Menu suspenso Application type → "Desktop app". Name: "FreeCrawl SEO Tool". Create → o diálogo mostra Client ID + Client Secret. Copie os dois imediatamente (o Secret não é mostrado de novo).\n\nPOR QUE DESKTOP: o FreeCrawl usa uma porta local aleatória (ex.: 127.0.0.1:63092) por conexão. "Web application" precisa de uma lista fixa de redirect URIs — essa porta aleatória não bate → falha. "Desktop app" aceita redirecionamentos loopback automaticamente, independente da porta.',
      },
      {
        title: 'Cole Client ID + Client Secret neste painel + Salvar',
        detail:
          'Dois campos: "OAuth Client ID" (...apps.googleusercontent.com) e "OAuth Client Secret" (GOCSPX-...). Salvar.',
      },
      {
        title: 'Clique em "Conectar" — seu navegador abre',
        detail:
          'Depois de Salvar o cartão mostra um botão "Conectar". Clique → a tela de consentimento do Google abre no seu navegador padrão.',
      },
      {
        title: 'Entre com a conta Google que você adicionou como usuário de teste',
        detail:
          'No seletor de contas escolha o e-mail que você adicionou aos usuários de teste. "Continue" → aviso "Google hasn\'t verified this app" (esperado no modo de teste). "Advanced" → "Go to FreeCrawl Local (unsafe)" → aceite as permissões → Allow.',
      },
      {
        title: 'De volta ao FreeCrawl — você deve ver "Configurado"',
        detail:
          'O cartão do Search Console em Configurações agora mostra um selo verde "Configurado". Você já pode ir para a aba superior "Search Console" para listar propriedades + buscar dados.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 access_denied"',
        solution:
          'Você não adicionou um usuário de teste, ou está entrando com a conta Google errada. Volte à página Audience e confira se a conta que você está usando está na lista de usuários de teste. Se tiver várias contas Google, veja qual o seletor de contas está usando.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'Ou a Search Console API não foi ativada OU a caixa de permissão "View Search Console data for your verified sites" da tela de consentimento OAuth estava desmarcada. (1) Ative a Search Console API (passo 5), (2) myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → clique em Conectar de novo e marque todas as permissões na tela de consentimento.',
      },
      {
        problem: '"redirect_uri_mismatch"',
        solution:
          'Tipo de cliente OAuth errado. Exclua o cliente na página Credentials e recrie como "Desktop app" (passo 7). "Web application" nunca vai funcionar para este fluxo.',
      },
      {
        problem: '"This app isn\'t verified" warning',
        solution:
          'Comportamento esperado (app em modo de teste + escopo sensível). Clique em "Advanced" → "Go to <app> (unsafe)" para prosseguir. O app está em modo de teste e só deixa entrar usuários de teste — é seguro.',
      },
      {
        problem: 'Connection broke after 7 days',
        solution:
          'Refresh tokens do OAuth expiram a cada 7 dias no modo de teste. Configurações → Integrações → Search Console → "Desconectar" → "Conectar" para autenticar de novo. Para se livrar da expiração é preciso passar o app pelo processo de verificação do Google (1-4 semanas).',
      },
    ],
    notes: [
      'As propriedades que você possui (sc-domain:example.com ou https://example.com/) incluem todos os sites que sua conta verificou.',
      'Os dados do GSC atrasam ~2 dias — os cliques de hoje não aparecem imediatamente.',
      'Cota gratuita: 1200 consultas/min, 25.000 consultas/dia — você nunca vai atingi-la em uso normal.',
    ],
    lastReviewed: '2026-06-01',
  },
  ga4: {
    intro:
      'Obtenha métricas do GA4 por URL (sessões, usuários, taxa de rejeição, taxa de engajamento, conversões). "Traga seu próprio cliente" — usa seu próprio cliente OAuth do GCP.',
    prereqs: [
      'Conta Google com pelo menos acesso de Leitor na propriedade do GA4 que você vai conectar.',
      'Você pode REUTILIZAR o mesmo cliente OAuth configurado para o GSC — basta ativar as APIs certas.',
    ],
    steps: [
      {
        title: 'Se você já configurou o GSC: REUTILIZE aquele cliente OAuth',
        detail:
          'Se o Search Console já está configurado, você pode usar o mesmo projeto do Google Cloud e o mesmo OAuth Client ID + Secret. Não precisa recriar — basta ativar as APIs abaixo e colar as credenciais aqui.',
      },
      {
        title: 'Ative AMBAS as APIs do GA4',
        detail:
          'O GA4 precisa de duas APIs distintas:\n\n1. Google Analytics Admin API (para listar propriedades)\n2. Google Analytics Data API (para os relatórios em si)\n\nSe não ativar as duas você verá erros "API not enabled".',
        link: {
          label: 'Admin API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com',
        },
      },
      {
        title: 'Ative também a Data API',
        link: {
          label: 'Data API → Enable',
          url: 'https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com',
        },
      },
      {
        title: 'Cole o mesmo Client ID + Secret que usou para o GSC',
        detail:
          'Se o GSC já estiver conectado, talvez nem precise colar — os cartões podem compartilhar credenciais. Se estiver configurando o GA4 do zero, copie o ID/Secret do seu cliente do GSC para este painel.',
      },
      {
        title: '"Conectar" → entre com o Google + aprove o escopo do GA4',
        detail:
          'Entre com a conta Google que você adicionou como usuário de teste. Na tela de consentimento confirme que a permissão "Google Analytics: View Google Analytics property data" está marcada.',
      },
      {
        title: 'Liste propriedades + busque na aba GA4',
        detail:
          'Vá para a aba superior "GA4" → "List Properties" mostra todas as propriedades do GA4 que sua conta enxerga → escolha uma → escolha uma janela (7/28/90 dias) → "Fetch". O GA4 é quase em tempo real, os resultados aparecem imediatamente.',
      },
    ],
    troubleshooting: [
      {
        problem: '"Google Analytics Admin API has not been used in project X"',
        solution:
          'Admin API não ativada. Abra o link do passo 2 → Enable. Aguarde 30 s, tente de novo. Em seguida você terá o mesmo erro para a Data API — abra o link do passo 3 e ative também.',
      },
      {
        problem: '"Request had insufficient authentication scopes"',
        solution:
          'O escopo OAuth não cobre o GA4. Vá em myaccount.google.com/permissions → "FreeCrawl Local" → Remove access → clique em Conectar de novo → marque a caixa da permissão do Google Analytics.',
      },
      {
        problem: 'Property list comes back empty',
        solution:
          'A conta Google conectada não tem nenhum papel em propriedades do GA4. Painel do GA4 → Admin → Property Access Management → confirme que seu e-mail tem pelo menos Leitor.',
      },
    ],
    notes: [
      'Os dados do GA4 são quase em tempo real — os de hoje aparecem em 4-24 horas.',
      'Cota gratuita: 200K requisições/dia, 50 requisições/min por propriedade.',
    ],
    lastReviewed: '2026-06-01',
  },
  sheets: {
    intro:
      'Exporte os resultados do rastreamento direto para uma planilha do Google Sheets. Melhor que "baixar CSV → abrir no Excel" quando você colabora com colegas num documento compartilhado ao vivo.',
    prereqs: [
      'Conta Google.',
      'Você pode REUTILIZAR o mesmo cliente OAuth configurado para o GSC.',
    ],
    steps: [
      {
        title: 'Se você configurou GSC/GA4: REUTILIZE aquele cliente OAuth',
        detail: 'Cole o mesmo OAuth Client ID + Secret (ou eles já podem estar salvos).',
      },
      {
        title: 'Ative a Google Sheets API',
        link: {
          label: 'Sheets API → Enable',
          url: 'https://console.cloud.google.com/apis/library/sheets.googleapis.com',
        },
      },
      {
        title: 'Ative também a Google Drive API',
        detail: 'A Sheets API também exige um escopo do Drive para criar/ler planilhas.',
        link: {
          label: 'Drive API → Enable',
          url: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
        },
      },
      {
        title: 'Cole Client ID + Secret + Salvar',
      },
      {
        title: '"Conectar" → aprove Sheets + Drive na tela de consentimento',
        detail:
          'O fluxo OAuth mostra duas permissões:\n• See, edit, create, and delete all your Google Sheets spreadsheets\n• See, edit, create, and delete only the specific Google Drive files used with this app\nMarque as duas.',
      },
      {
        title: 'Teste pelo menu Exportar',
        detail:
          'Arquivo → Exportar → "Exportar para Google Sheets". Uma planilha nova é criada automaticamente e a URL copiada para a área de transferência.',
      },
    ],
    troubleshooting: [
      {
        problem: '"insufficient authentication scopes"',
        solution:
          'Você não marcou a caixa da permissão do Drive ao conectar. Desconecte + reconecte, marque as duas permissões.',
      },
    ],
    notes: [
      'Limite rígido do Sheets: 10M de células por planilha — rastreamentos grandes (>500K URLs) são divididos.',
      'O escopo do Drive é "drive.file" — só os arquivos criados pelo FreeCrawl ficam acessíveis, não os seus arquivos existentes.',
    ],
    lastReviewed: '2026-06-01',
  },
  bigquery: {
    intro:
      'Envie os dados do rastreamento direto para um conjunto de dados do BigQuery. Útil para acumular snapshots datados no seu data warehouse e visualizar tendências de rastreamento com uma ferramenta de BI (Looker Studio, Tableau, Metabase).',
    prereqs: [
      'Projeto do Google Cloud com a BigQuery API ativada.',
      'Conjunto de dados do BigQuery já criado.',
      'JSON de conta de serviço (NÃO OAuth — autenticação servidor a servidor).',
      'Projeto GCP com faturamento ativado (nível gratuito do BigQuery: 10GB de armazenamento/mês + 1TB de consultas/mês; cobra além disso).',
    ],
    steps: [
      {
        title: 'Crie um conjunto de dados do BigQuery',
        detail:
          'Console do BigQuery → escolha seu projeto → "Create dataset" → ID: "freecrawl_seo" (ou qualquer nome) → Location: "EU" ou "US" (importante — não dá para mudar depois) → Create dataset.',
        link: {
          label: 'Console do BigQuery',
          url: 'https://console.cloud.google.com/bigquery',
        },
      },
      {
        title: 'Crie uma conta de serviço',
        detail:
          'IAM & Admin → Service Accounts → "+ Create service account" → nome: "freecrawl-bigquery" → Create and continue.',
        link: {
          label: 'Service Accounts',
          url: 'https://console.cloud.google.com/iam-admin/serviceaccounts',
        },
      },
      {
        title: 'Adicione papéis',
        detail:
          'No passo 2 "Grant this service account access to project" → adicione dois papéis:\n• BigQuery Data Editor\n• BigQuery Job User\nDepois "Continue" → "Done".',
      },
      {
        title: 'Baixe a chave JSON',
        detail:
          'Na lista de contas de serviço clique na que acabou de criar → aba "Keys" → "Add key" → "Create new key" → Type: JSON → Create.\n\nO JSON baixa automaticamente. Abra num editor de texto e copie todo o conteúdo.\n\nATENÇÃO: este JSON contém toda a credencial — trate como uma senha. Nunca envie para controle de versão.',
      },
      {
        title: 'Cole no campo "Service Account JSON" deste painel',
        detail:
          'Cole o JSON completo (da chave de abertura `{` até a de fechamento `}`). O FreeCrawl guarda o JSON criptografado no cofre de credenciais do sistema.',
      },
      {
        title: 'Preencha "GCP Project ID"',
        detail:
          'O ID do seu projeto GCP (aparece no menu suspenso superior esquerdo do Cloud Console, ex.: "my-gcp-project-12345"). O JSON também tem um campo "project_id" — dá para copiar de lá.',
      },
      {
        title: 'Informe o nome do conjunto de dados + Salvar',
        detail: 'O nome do conjunto de dados que você criou no passo 1 (ex.: "freecrawl_seo").',
      },
      {
        title: 'Teste pelo menu Exportar',
        detail:
          'Arquivo → Exportar → "Exportar para BigQuery" → escolha nome/formato da tabela → execute. Verifique se a tabela apareceu no Console do BigQuery.',
      },
    ],
    troubleshooting: [
      {
        problem: '"403 PermissionDenied: caller does not have permission"',
        solution:
          'Faltam papéis de IAM na conta de serviço. IAM & Admin → IAM → encontre o e-mail da sua conta de serviço → confirme que "BigQuery Data Editor" e "BigQuery Job User" estão atribuídos.',
      },
      {
        problem: '"Dataset X not found"',
        solution:
          'Nome do conjunto de dados errado OU divergência de localização (multirregião "EU" vs região "europe-west1"). Copie o nome exato do conjunto de dados do Console do BigQuery.',
      },
      {
        problem: '"Invalid JSON"',
        solution:
          'Você colou só parte do JSON ou há um caractere perdido nas bordas. Abra o arquivo JSON da conta de serviço com um editor de verdade (VS Code recomendado, NÃO o Bloco de Notas), Ctrl+A para selecionar tudo, copie, limpe o campo do FreeCrawl, cole.',
      },
    ],
    notes: [
      'Custo: o nível gratuito do BigQuery (10GB de armazenamento + 1TB de consultas/mês) cobre o uso normal. Um rastreamento de 1M de URLs tem ~500MB; o custo das consultas depende do seu SQL.',
      'Evolução do esquema: o FreeCrawl cria/atualiza a tabela de exportação automaticamente. Se o esquema CrawlUrlRow ganhar colunas novas, a tabela de exportação as incorpora (flexibilidade DDL do BigQuery).',
    ],
    lastReviewed: '2026-06-01',
  },
};
