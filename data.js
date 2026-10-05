// ============================================================
// data.js — HairOS Database v5.0 (com prompts individuais)
// Motor: v2 (normalizeItem, searchItems, alturas determinísticas)
// Dados: v5.0 (cortes, colorações, produtos, kits e ferramentas)
// ============================================================


// ============================================================
// 1. UTILITÁRIOS
// ============================================================

function shuffleArray(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
  }
  return arr;
}

function getAlturaById(id) {
  if (!id) return 'h-md';
  var hash = 0;
  for (var i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash | 0;
  }
  var mod = Math.abs(hash) % 3;
  return mod === 0 ? 'h-md' : mod === 1 ? 'h-lg' : 'h-xl';
}

function getAlturaHome() {
  return 'h-md';
}

function normalizeItem(item) {
  if (Array.isArray(item)) {
    return {
      id: item[0] || '',
      cat: item[1] || '',
      corte: item[2] || '',
      title: item[3] || '',
      desc: item[4] || '',
      img: item[5] || '',
      variants: Array.isArray(item[6]) ? item[6] : [],
      tags: [],
      comprimento: null,
      prompt: ''
    };
  }
  return {
    id: item.id || '',
    cat: item.cat || item.categoria || '',
    corte: item.corte || '',
    title: item.title || '',
    desc: item.desc || '',
    img: item.img || '',
    variants: Array.isArray(item.variants) ? item.variants : [],
    tags: Array.isArray(item.tags) ? item.tags : [],
    comprimento: item.comprimento || null,
    prompt: typeof item.prompt === 'string' ? item.prompt : ''
  };
}

function _getVariantUrl(v) {
  return (typeof v === 'object' && v !== null) ? v.img : v;
}

function _dedupeVariantsByUrl(variants) {
  var seen = {}, unique = [];
  variants.forEach(function (v) {
    var url = _getVariantUrl(v);
    if (url && !seen[url]) { seen[url] = true; unique.push(v); }
  });
  return unique;
}

var FALLBACK_IMG = 'https://i.pinimg.com/736x/1e/59/3c/1e593c46f134db1bc0233b96d12d555f.jpg';

function safeImg(url) {
  return url || FALLBACK_IMG;
}


// ============================================================
// 2. KITS DE AFILIADO — fonte única (Mercado Livre)
// ============================================================
var kitsAfiliados = [
  {
    id: 'kit-keune',
    nome: 'Kit Keune',
    badge: 'Comercial',
    categoria: 'coloracao',
    link: 'https://meli.la/1GbiW7M',
    produtos: 'Tinta Color + Semi Color + Oxidante 20 vol + Ativador de Cor',
    imagem: 'https://i.pinimg.com/736x/f9/71/b6/f971b6679e2c7fda2f777c25d6e49b66.jpg'
  },
  {
    id: 'kit-loreal-inoa',
    nome: "Kit L'Oréal",
    badge: 'Técnico',
    categoria: 'coloracao',
    link: 'https://meli.la/28LpPj2',
    produtos: 'Tinta INOA + Tonalizante Dia Color + Oxidante 20 vol + Revelador 9 vol',
    imagem: 'https://i.pinimg.com/1200x/8a/c7/0e/8ac70e6de8ca914b0a3e53ff6b93a0cc.jpg'
  },
  {
    id: 'kit-kerastase',
    nome: 'Kit Kerastase',
    badge: 'Premium',
    categoria: 'cuidados',
    link: 'https://meli.la/1MwSY7v',
    produtos: 'Shampoo Nutritive + Condicionador Resistance + Máscara Genesis + Leave-In Elixir Ultime',
    imagem: 'https://i.pinimg.com/1200x/0c/dd/f1/0cddf1a088784488cc73ffbedfa53ebf.jpg'
  },
  {
    id: 'kit-loreal-expert',
    nome: "Kit L'Oréal Expert",
    badge: 'Profissional',
    categoria: 'cuidados',
    link: 'https://meli.la/2nmeunk',
    produtos: 'Shampoo Vitamino Color + Condicionador Absolut Repair + Máscara Nutrioil + Sérum Pro Longer',
    imagem: 'https://i.pinimg.com/1200x/1b/8f/6d/1b8f6d4c9a2e5b7f3c1d8a4e6b9f2c74.jpg'
  },
  {
    id: 'kit-joico',
    nome: 'Kit Joico',
    badge: 'Hidratação',
    categoria: 'cuidados',
    link: 'https://meli.la/2x9xqBe',
    produtos: 'Shampoo Moisture Recovery + Condicionador + Máscara Intensa + Leave-In K-PAK',
    imagem: 'https://i.pinimg.com/1200x/55/d6/10/55d610f599b3c10b5fe4cafceb5104fc.jpg'
  },
  {
    id: 'kit-ferramentas',
    nome: 'Kit Ferramentas Profissionais',
    badge: 'Ferramentas',
    categoria: 'ferramentas',
    link: 'https://meli.la/2H5F4mn',
    produtos: 'Secador Iônico Pro + Prancha de Titânio + Escova Rotativa',
    imagem: 'https://i.pinimg.com/736x/7f/4d/8b/7f4d8b424f29dffaa67ad8856df09263.jpg'
  }
];


// ============================================================
// 3. HELPERS DE CONSULTA
// ============================================================

function getKitsByCategoria(cat) {
  return kitsAfiliados.filter(function (k) { return k.categoria === cat; });
}

function getKitById(id) {
  return kitsAfiliados.find(function (k) { return k.id === id; }) || null;
}

var coloracaoKits = { kits: getKitsByCategoria('coloracao') };
var cuidadosKits = { kits: getKitsByCategoria('cuidados') };
var ferramentasKits = { kits: getKitsByCategoria('ferramentas') };

function getOtherProducts(currentId, sourceArray, count) {
  var pool = [];
  var seenImgs = {};

  sourceArray.forEach(function (raw) {
    var item = normalizeItem(raw);
    if (item.id === currentId) return;

    var mainImg = item.variants.length > 0 ? _getVariantUrl(item.variants[0]) : item.img;
    if (!mainImg || seenImgs[mainImg]) return;
    seenImgs[mainImg] = true;

    pool.push({
      id: item.id,
      cat: item.cat,
      corte: item.corte,
      title: item.title,
      desc: item.desc,
      img: item.img,
      variants: item.variants.slice(0, 3)
    });
  });

  shuffleArray(pool);
  return pool.slice(0, count);
}

function searchItems(query, filters) {
  filters = filters || {};
  var q = (query || '').toLowerCase().trim();
  var all = []
    .concat(cortesData, coloracoesData, produtosData, kitsData, ferramentasData)
    .map(normalizeItem);

  return all.filter(function (item) {
    if (filters.cat && item.cat !== filters.cat) return false;
    if (filters.comprimento && item.comprimento !== filters.comprimento) return false;
    if (filters.tags && filters.tags.length) {
      var hasTag = filters.tags.some(function (t) {
        return item.tags.indexOf(t) !== -1;
      });
      if (!hasTag) return false;
    }
    if (!q) return true;
    return (
      item.id.toLowerCase().indexOf(q) !== -1 ||
      item.corte.toLowerCase().indexOf(q) !== -1 ||
      item.title.toLowerCase().indexOf(q) !== -1 ||
      item.desc.toLowerCase().indexOf(q) !== -1 ||
      item.tags.join(' ').toLowerCase().indexOf(q) !== -1
    );
  });
}

function getByCategoria(cat) {
  return searchItems('', { cat: cat });
}

function getItemById(id) {
  var all = []
    .concat(cortesData, coloracoesData, produtosData, kitsData, ferramentasData)
    .map(normalizeItem);
  return all.find(function (item) { return item.id === id; }) || null;
}


// ============================================================
// 4. createCard — montador principal
// ============================================================

function _buildProdutoKitVariants(norm, sourceArray) {
  var ownImgs = _dedupeVariantsByUrl(
    norm.variants.length > 0 ? norm.variants.slice(0, 3) : [norm.img]
  );

  var finalVariants = ownImgs.map(function (imgUrl) {
    return { img: imgUrl, corte: norm.corte, title: norm.title, desc: norm.desc, own: true };
  });

  var others = getOtherProducts(norm.id, sourceArray, 7);
  others.forEach(function (p) {
    var img = (p.variants && p.variants.length > 0)
      ? _getVariantUrl(p.variants[0])
      : p.img;
    finalVariants.push({
      img: img, corte: p.corte, title: p.title, desc: p.desc,
      own: false, productId: p.id
    });
  });

  if (finalVariants.length < 10 && ownImgs.length > 0) {
    var seenInFinal = {};
    finalVariants.forEach(function (v) { seenInFinal[_getVariantUrl(v)] = true; });
    var filled = 0;
    while (finalVariants.length < 10 && filled < ownImgs.length * 3) {
      var candidate = ownImgs[filled % ownImgs.length];
      var url = _getVariantUrl(candidate);
      if (!seenInFinal[url]) {
        seenInFinal[url] = true;
        finalVariants.push({
          img: url, corte: norm.corte, title: norm.title,
          desc: norm.desc, own: true
        });
      }
      filled++;
    }
  }

  return { finalVariants: finalVariants, otherProducts: others };
}

function _buildCorteColoracaoVariants(norm) {
  var raw = norm.variants.length > 0 ? norm.variants.slice(0, 10) : [norm.img];
  var unique = _dedupeVariantsByUrl(raw);
  return unique.length > 0 ? unique : [norm.img];
}

function createCard(id, categoria, corte, title, desc, img, variants, prompt) {
  var norm = normalizeItem({
    id: id, cat: categoria, corte: corte,
    title: title, desc: desc, img: safeImg(img),
    variants: variants || [],
    prompt: prompt || ''
  });

  var finalVariants = [];
  var otherProductsData = [];
  var isProduto = ['produto', 'kit', 'ferramentas'].indexOf(norm.cat) !== -1;
  var sourceMap = {
    'kit': kitsData,
    'ferramentas': ferramentasData,
    'produto': produtosData
  };

  if (isProduto) {
    var source = sourceMap[norm.cat] || produtosData;
    var result = _buildProdutoKitVariants(norm, source);
    finalVariants = result.finalVariants;
    otherProductsData = result.otherProducts;
  } else {
    finalVariants = _buildCorteColoracaoVariants(norm);
  }

  return {
    id: norm.id,
    categoria: norm.cat,
    corte: norm.corte,
    title: norm.title,
    desc: norm.desc,
    img: norm.img,
    tags: norm.tags,
    comprimento: norm.comprimento,
    prompt: norm.prompt,
    variants: finalVariants,
    otherProductsData: otherProductsData,
    coloracao: coloracaoKits,
    cuidados: cuidadosKits,
    ferramentas: ferramentasKits,
    altura: getAlturaById(norm.id),
    isUserPhoto: norm.id && norm.id.startsWith('user_')
  };
}


// ============================================================
// 5. DADOS: CORTES (30 itens com prompt individual)
// ============================================================
var cortesData = [
  {
    id: 'velvet-bob', cat: 'corte', corte: 'Velvet', title: 'Bob Texturizado',
    desc: 'Camadas internas que dão volume sem peso. Oval, redondo e coração. Manutenção baixa, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/d7/a8/8c/d7a88c60e5f7ce217264486e3fc506f4.jpg',
    variants: [
      'https://i.pinimg.com/736x/4a/d9/5b/4ad95bf7e6b141aadff33031fd09e9c5.jpg',
      'https://i.pinimg.com/736x/8d/9d/d7/8d9dd736af07495c8cd74672e0c88476.jpg',
      'https://i.pinimg.com/736x/bf/d5/70/bfd57032bcaddc8df549a25c2f5ee43e.jpg',
      'https://i.pinimg.com/736x/83/7b/6a/837b6aca26c733bd41c28c0153942a49.jpg',
      'https://i.pinimg.com/736x/46/34/e4/4634e474c43b6a8aa6f7459023b5ab94.jpg',
      'https://i.pinimg.com/736x/37/7a/d5/377ad5273df5fe2cf671d873d31d6393.jpg',
      'https://i.pinimg.com/736x/c4/06/57/c40657b0890088f4007ab9cc047c548e.jpg',
      'https://i.pinimg.com/736x/57/00/8b/57008bbead8ee5cbd7259af613e74690.jpg',
      'https://i.pinimg.com/736x/50/40/cb/5040cb20ff9f1936cda703a116cc6800.jpg',
      'https://i.pinimg.com/736x/12/97/7a/12977a09186ad656e31bd1820ebca998.jpg'
    ],
    prompt: 'Corte Bob Texturizado (Velvet Bob) aplicado respeitando a referência:\n- Comprimento: na altura do queixo, reto na base, levemente arredondado nas laterais.\n- Camadas: internas, invisíveis, criando volume na base sem marcar.\n- Textura: pontas texturizadas com leve desfiado, movimento suave.\n- Franja: sem franja marcada; risco lateral ou central.\n- Volume: concentrado na base e nas laterais, topo mais liso.\n- Direção do caimento: para frente e levemente para os lados, com pontas viradas para dentro.\n- Acabamento: polido com pontas soltas, efeito "arrumado mas natural".'
  },
  {
    id: 'pixie-cut', cat: 'corte', corte: 'Pixie', title: 'Corte Curto Texturizado',
    desc: 'Topo volumoso com laterais curtas e proporcionais. Oval, coração e triângulo invertido. Manutenção alta, retoque a cada 4 semanas.',
    img: 'https://i.pinimg.com/736x/34/27/f8/3427f83ed4451e1e17aa9822e4201d96.jpg',
    variants: [
      'https://i.pinimg.com/736x/c7/96/f6/c796f647e8e72985856e0032ffba1bd1.jpg',
      'https://i.pinimg.com/736x/86/95/8b/86958b5ee0a8cbf5e0082666ef203ed7.jpg',
      'https://i.pinimg.com/736x/25/f3/7a/25f37a9f5dd2740755ba53f3f3f4f313.jpg',
      'https://i.pinimg.com/736x/86/7d/73/867d730483c8d6db0a09f2c8e8f93427.jpg',
      'https://i.pinimg.com/736x/88/1e/dc/881edc6b830ca7fd49a95d551425b0c6.jpg',
      'https://i.pinimg.com/736x/21/13/90/211390e156a9c58109c38eb79b7fc2f2.jpg',
      'https://i.pinimg.com/736x/c8/ed/d8/c8edd8088204b8fd6f08beb57300c820.jpg',
      'https://i.pinimg.com/736x/3b/40/e6/3b40e60333fe00cec1b0a56cd5892dc8.jpg',
      'https://i.pinimg.com/736x/c3/56/54/c35654251423eb9a44ea088a3bf17c90.jpg',
      'https://i.pinimg.com/236x/ad/e7/ab/ade7ab449fad2d5f26c782b0aea4988f.jpg'
    ],
    prompt: 'Corte Pixie Texturizado aplicado respeitando a referência:\n- Comprimento: bem curto, acima da orelha, topo com 4–6 cm.\n- Topo: volumoso, com camadas pontiagudas e texturizadas, levemente bagunçado.\n- Laterais: curtas, ajustadas à cabeça, sem degradê marcado.\n- Nuca: curta, arredondada, bem aparada.\n- Textura: pontas desfiadas, movimento para cima e para frente.\n- Franja: curta, texturizada, com risco lateral deslocado.\n- Volume: concentrado no topo, criando altura.\n- Direção do caimento: para cima e para frente, com fios soltos.'
  },
  {
    id: 'butterfly-cut', cat: 'corte', corte: 'Butterfly', title: 'Camadas em Asa',
    desc: 'Duas camadas em asa com base pesada e movimento. Oval, alongado e retangular. Manutenção média, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/08/ab/69/08ab69db905060f2e62a6bed57d3e74e.jpg',
    variants: [
      'https://i.pinimg.com/736x/5d/03/57/5d03576e6204c75b1bcd95d3f60c0e49.jpg',
      'https://i.pinimg.com/736x/35/83/99/358399b0b37e83d864a58c0237875a9d.jpg',
      'https://i.pinimg.com/736x/31/19/fb/3119fb4703a12cd9867c83cc38be904e.jpg',
      'https://i.pinimg.com/736x/1e/79/0e/1e790e7d03357af0bb59fae1aaae5985.jpg',
      'https://i.pinimg.com/1200x/ec/97/85/ec9785ae609edd9958245167b09b776a.jpg',
      'https://i.pinimg.com/736x/66/bb/26/66bb266d7934a62d3f30132a9f8e7bc6.jpg',
      'https://i.pinimg.com/1200x/e0/78/98/e078985c0a53eb4cab512bc560332e25.jpg',
      'https://i.pinimg.com/1200x/cb/85/d2/cb85d255cd035178f3f3270ab9943769.jpg',
      'https://i.pinimg.com/1200x/55/93/b2/5593b2539cc1c588ed90f7070a3cda0b.jpg',
      'https://i.pinimg.com/736x/3e/08/65/3e0865833599c47473882c25165ecbfc.jpg'
    ],
    prompt: 'Corte Butterfly (camadas em asa) aplicado respeitando a referência:\n- Comprimento: longo, abaixo dos ombros, com base pesada e densa.\n- Camadas: duas camadas principais — uma curta na altura da maçã do rosto e outra longa na base. Efeito "asa".\n- Topo: liso com leve volume nas laterais.\n- Textura: pontas soltas com movimento natural, sem desfiado pesado.\n- Franja: camadas frontais emoldurando o rosto, tipo curtain bangs longas.\n- Volume: máximo nas laterais (efeito asa), mínimo no topo.\n- Direção do caimento: para frente e para os lados, com pontas viradas para fora.'
  },
  {
    id: 'blunt-cut', cat: 'corte', corte: 'Blunt', title: 'Corte Reto Preciso',
    desc: 'Zero camadas: linha reta e precisa. Oval, alongado e retangular. Manutenção baixa, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/06/15/ff/0615ff8b4ad4d40cf86d8f738b91eb44.jpg',
    variants: [
      'https://i.pinimg.com/736x/87/1e/58/871e58b257c2ea53fbf7d71e76ffac3d.jpg',
      'https://i.pinimg.com/736x/37/06/de/3706de631afd06d34889c7957cea2ac1.jpg',
      'https://i.pinimg.com/736x/d6/ad/6e/d6ad6ed52b34ec8c0864345b5a79f80b.jpg',
      'https://i.pinimg.com/736x/4c/81/ed/4c81edd88a8f0fd8864e8b62fe0ed142.jpg',
      'https://i.pinimg.com/736x/4e/56/aa/4e56aa5be62fef617d4f6b5859aa8877.jpg',
      'https://i.pinimg.com/736x/f5/b8/5a/f5b85a3a195abe2e8fc1a475877a3e59.jpg',
      'https://i.pinimg.com/736x/9f/ff/28/9fff284e6d32430e4e8c7528c5db8b2a.jpg',
      'https://i.pinimg.com/736x/8d/90/4a/8d904a812c89f78d6a6580479c5639ac.jpg',
      'https://i.pinimg.com/236x/da/86/9a/da869a53567960e3ec375761ad87282e.jpg',
      'https://i.pinimg.com/236x/09/99/a2/0999a2392476e22f3e1540928e506741.jpg'
    ],
    prompt: 'Corte Blunt (reto preciso) aplicado respeitando a referência:\n- Comprimento: longo, abaixo dos ombros ou na altura dos ombros, conforme referência.\n- Camadas: ZERO camadas. Linha única, reta e precisa na base.\n- Topo: liso, sem volume artificial, acompanhando o formato natural da cabeça.\n- Textura: lisa, alinhada, sem desfiado. Fios densos e uniformes.\n- Franja: sem franja, ou franja reta pesada (se a referência mostrar).\n- Volume: mínimo, fios alinhados e densos.\n- Direção do caimento: reto, vertical, com pontas alinhadas horizontalmente.\n- Acabamento: polido, efeito "corte de faca", sem pontas soltas.'
  },
  {
    id: 'shaggy-hair', cat: 'corte', corte: 'Shaggy', title: 'Camadas Desconectadas',
    desc: 'Camadas cruas e desconectadas com franja despretensiosa. Oval, quadrado e coração. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/e7/6a/22/e76a22e038cba1d1daad41e6f2238004.jpg',
    variants: [
      'https://i.pinimg.com/736x/6b/2f/c2/6b2fc2069e0ab8ba141565ea5e582d58.jpg',
      'https://i.pinimg.com/736x/c9/2d/a3/c92da3565d7caf7b75db3fdceb30533f.jpg',
      'https://i.pinimg.com/236x/99/7b/f9/997bf983affdcdec08562f8a02c374b6.jpg',
      'https://i.pinimg.com/736x/57/72/22/5772226643794074a0c51185ea867c17.jpg',
      'https://i.pinimg.com/736x/d7/f2/2b/d7f22bca30309f62004694c1f7dafa73.jpg',
      'https://i.pinimg.com/736x/df/5b/db/df5bdb685898292a9ca41b8bbb43ab31.jpg',
      'https://i.pinimg.com/736x/e2/ab/f8/e2abf8b4b139df7b29c8551f40d4d338.jpg',
      'https://i.pinimg.com/736x/2a/eb/88/2aeb88213907101e1792b014a75fb4b3.jpg',
      'https://i.pinimg.com/736x/e0/ab/81/e0ab810bc60a2b40ec842c78a01f2de0.jpg',
      'https://i.pinimg.com/736x/46/bb/b8/46bbb8d4c1c4a748cb6cd717378d2e1a.jpg'
    ],
    prompt: 'Corte Shaggy aplicado respeitando a referência:\n- Comprimento: médio, entre o queixo e os ombros, com nuca levemente alongada.\n- Camadas: cruas, desconectadas, visíveis, sem transição suave.\n- Topo: curto e volumoso, com fios bagunçados.\n- Laterais: camadas médias criando movimento para fora.\n- Textura: desfiada, pontas soltas, efeito "acordei assim".\n- Franja: despretensiosa, em camadas curtas e irregulares emoldurando o rosto.\n- Volume: distribuído, com picos no topo e nas laterais.\n- Direção do caimento: bagunçado, para frente e para os lados, sem direção única.'
  },
  {
    id: 'long-bob', cat: 'corte', corte: 'Lob', title: 'Bob Ombro Inclinado',
    desc: 'Base inclinada para frente, mais longo na frente. Redondo, quadrado e coração. Manutenção baixa, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/63/fc/05/63fc05a4610ab0214e2e74e3d6a0014f.jpg',
    variants: [
      'https://i.pinimg.com/736x/96/ed/ba/96edbad796f6419dde511218d30b4a89.jpg',
      'https://i.pinimg.com/736x/97/12/55/971255981aaef5c19d234cbe7bb15b5b.jpg',
      'https://i.pinimg.com/736x/20/e5/0e/20e50e3d7d91ea1c77739beef358253e.jpg',
      'https://i.pinimg.com/736x/d2/3f/6c/d23f6cb6d4eba707e8af9dbd0365d7b3.jpg',
      'https://i.pinimg.com/236x/5b/d6/67/5bd6678622f65f802a790f27193d2b43.jpg',
      'https://i.pinimg.com/736x/b3/23/38/b323381530d017a718dfd57ebb70f280.jpg',
      'https://i.pinimg.com/736x/f2/f4/09/f2f4094f58a52962676524bcc79dc511.jpg',
      'https://i.pinimg.com/736x/a3/c2/a8/a3c2a82d52cb1f590ebbb7b6ba386229.jpg',
      'https://i.pinimg.com/736x/03/38/48/033848a08f6285b6473392e31710c7b5.jpg',
      'https://i.pinimg.com/736x/62/56/a8/6256a87f0bc5ce4ad04e5008e3e75c3c.jpg'
    ],
    prompt: 'Corte Long Bob (Lob) inclinado aplicado respeitando a referência:\n- Comprimento: na altura dos ombros, com a frente mais longa que a nuca (A-line / inclinado).\n- Camadas: mínimas, apenas o suficiente para criar movimento nas pontas.\n- Topo: liso, sem volume artificial.\n- Textura: alinhada com leve movimento nas pontas.\n- Franja: sem franja marcada, ou curtain bangs longas laterais.\n- Volume: mínimo no topo, leve nas pontas.\n- Direção do caimento: reto, com a frente caindo à frente dos ombros e a nuca mais curta.\n- Acabamento: polido com pontas viradas levemente para dentro ou para fora.'
  },
  {
    id: 'french-bob', cat: 'corte', corte: 'French', title: 'Chanel com Franja',
    desc: 'Curtíssimo no maxilar com franja reta. O mais curto dos bobs. Oval, coração e alongado. Manutenção alta, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/736x/9a/2e/4f/9a2e4f0d8c3b7a1e6f5d4c2b8a9e7f31.jpg',
    variants: [
      'https://i.pinimg.com/736x/4b/7c/1a/4b7c1a9e3f2d8b6a5c4e1f7d9b3a2c84.jpg',
      'https://i.pinimg.com/736x/8e/3d/5b/8e3d5b2c9a1f7e4d6b8c3a2f5e9d1b47.jpg',
      'https://i.pinimg.com/736x/2c/9f/6e/2c9f6e4a7b1d3c8f5e2a9d4b6c7f1e83.jpg',
      'https://i.pinimg.com/736x/6a/1b/8d/6a1b8d3e5f2c7a4b9e1d6c8f3a2b5e74.jpg',
      'https://i.pinimg.com/736x/3e/7a/2c/3e7a2c9f4b6d1e8a5c3f7b2d9a4e6c15.jpg',
      'https://i.pinimg.com/736x/9c/4f/7e/9c4f7e2a5d8b3c1f6e9a4d7b2c5f8e31.jpg',
      'https://i.pinimg.com/736x/5d/8b/3a/5d8b3a6c9f2e4d7b1a8c5f3e6d9b2a47.jpg',
      'https://i.pinimg.com/736x/7f/2e/9c/7f2e9c4b6a1d8f5e3c2b7a9d4f6e1c58.jpg',
      'https://i.pinimg.com/736x/1a/6d/4f/1a6d4f8b3c9e2a7d5f1b8c4e6a9d3f72.jpg',
      'https://i.pinimg.com/736x/8b/5c/2e/8b5c2e7a4f9d1b6c3e8a5f2d7b4c9e16.jpg'
    ],
    prompt: 'Corte French Bob (chanel com franja) aplicado respeitando a referência:\n- Comprimento: curtíssimo, na linha do maxilar, reto e preciso.\n- Camadas: zero ou mínimas, apenas para arredondar as pontas.\n- Topo: liso com leve volume natural.\n- Textura: alinhada, levemente texturizada nas pontas.\n- Franja: reta, pesada, cobrindo a testa até logo acima das sobrancelhas.\n- Volume: mínimo, fios densos e alinhados.\n- Direção do caimento: reto com pontas viradas levemente para dentro.\n- Acabamento: polido, parisiense, efeito "chanel clássico".'
  },
  {
    id: 'italian-bob', cat: 'corte', corte: 'Italian', title: 'Bob com Repicados',
    desc: 'Repicados internos com volume concentrado na base. Oval, alongado e retangular. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/f5/fe/29/f5fe294a026ca252b16fdfb6eab958e5.jpg',
    variants: [
      'https://i.pinimg.com/1200x/8e/f9/30/8ef93086d8b7f7754433ce6ca6e9d011.jpg',
      'https://i.pinimg.com/1200x/ed/80/40/ed8040ed4f0bcdb6c8ada69f3503f9c6.jpg',
      'https://i.pinimg.com/736x/84/57/ef/8457ef1450b5557e181cad27cd6f06a7.jpg',
      'https://i.pinimg.com/736x/af/3f/ab/af3fab13144b7ef5b5e77c8230b4f235.jpg',
      'https://i.pinimg.com/736x/4f/63/b4/4f63b42a1dbcf29bf0dad0590d5a6548.jpg',
      'https://i.pinimg.com/1200x/28/04/a4/2804a4eed55aff1f0a0ce1c3dbd4ef6f.jpg',
      'https://i.pinimg.com/1200x/0a/74/fe/0a74fee1be0245c8407f89a63a533019.jpg',
      'https://i.pinimg.com/1200x/90/27/0a/90270a5f82b31b3111e0be5a97be214b.jpg',
      'https://i.pinimg.com/1200x/b3/b2/3a/b3b23ae2980ee50d6a1d4ba922897237.jpg',
      'https://i.pinimg.com/1200x/8e/d8/bc/8ed8bcdab25ed919ae05c43dcd2113e0.jpg'
    ],
    prompt: 'Corte Italian Bob aplicado respeitando a referência:\n- Comprimento: na altura do queixo ou ligeiramente abaixo, com base arredondada.\n- Camadas: repicados internos que criam volume na base e nas laterais.\n- Topo: relativamente liso, com leve movimento natural.\n- Textura: pontas repicadas, movimento para fora e para cima.\n- Franja: sem franja ou com franja lateral longa.\n- Volume: concentrado na base e nas laterais, criando efeito arredondado.\n- Direção do caimento: para frente com pontas viradas para fora.\n- Acabamento: volumoso, com movimento, efeito "italiano sofisticado".'
  },
  {
    id: 'wolf-cut', cat: 'corte', corte: 'Wolf', title: 'Topo Volumoso',
    desc: 'Topo curto e rebelde com nuca longa. Mullet + shag. Oval, quadrado e coração. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/8a/3e/6c/8a3e6c9d2f5b7a4e1c8d3f6b9a2e5c74.jpg',
    variants: [
      'https://i.pinimg.com/736x/4c/9f/2a/4c9f2a7d5b8e3c1f6a9d4b7e2c5f8a31.jpg',
      'https://i.pinimg.com/736x/7b/1d/8e/7b1d8e4c6a9f2d5b3e7c1a8f4d6b2e95.jpg',
      'https://i.pinimg.com/736x/2f/6a/9c/2f6a9c4b7d1e8f5a3c6b9d2e4f7a1c58.jpg',
      'https://i.pinimg.com/736x/9e/4b/1f/9e4b1f8d5a2c7e6b3f9d4a1c8e5b7f62.jpg',
      'https://i.pinimg.com/736x/6d/8a/3c/6d8a3c9f2b5e7a1d4c8f6b3a9e2d5c17.jpg',
      'https://i.pinimg.com/736x/1c/7e/5b/1c7e5b9d3f6a2c8e4b1d7f5a9c3e6b84.jpg',
      'https://i.pinimg.com/736x/8f/2d/7a/8f2d7a4c9e1b6d3f5a8c2e7b4d9f1a36.jpg',
      'https://i.pinimg.com/736x/5b/9c/4e/5b9c4e1f7a3d8b6c2f9e5a4d7c1b8f43.jpg',
      'https://i.pinimg.com/736x/3a/6f/8d/3a6f8d2b5c9e4a7f1d3b6c8e5a2f9d71.jpg',
      'https://i.pinimg.com/736x/9f/1e/6b/9f1e6b3d8a4c7f2e5b9d1a6c4f8e3b25.jpg'
    ],
    prompt: 'Corte Wolf Cut aplicado respeitando a referência:\n- Comprimento total: médio, atingindo a altura dos ombros, com nuca mais longa (estilo mullet).\n- Topo: curto, volumoso, com camadas desconectadas e desconexas.\n- Laterais: camadas curtas criando efeito "rebelde" e desconexo.\n- Textura: desfiada, pontas soltas e movimento constante.\n- Franja: camadas curtas emoldurando o rosto (curtain bangs opcionais).\n- Volume: concentrado no topo, decrescente em direção às pontas.\n- Direção do caimento: para frente e levemente para os lados.\n- O corte deve parecer natural no rosto da cliente, adaptando-se ao formato do rosto real sem forçar identidade.'
  },
  {
    id: 'bixie-cut', cat: 'corte', corte: 'Bixie', title: 'Híbrido Pixie-Bob',
    desc: 'Meio pixie, meio bob, desfiado e prático. Oval, coração e triângulo invertido. Manutenção média, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/736x/4e/66/83/4e66838f18fe2212fa8ac412d9985447.jpg',
    variants: [
      'https://i.pinimg.com/736x/ff/cb/e9/ffcbe9b68c10a9bf44b1610bbc6c3c0f.jpg',
      'https://i.pinimg.com/736x/24/39/90/243990bf81ae8af3e11281d755177fba.jpg',
      'https://i.pinimg.com/1200x/12/48/cb/1248cb0903da34be6111206cb6cf9468.jpg',
      'https://i.pinimg.com/736x/01/a2/3b/01a23b43d228aa31af028939a2ec9b06.jpg',
      'https://i.pinimg.com/736x/63/c7/3d/63c73d3104192776cc9ce37688722ef3.jpg',
      'https://i.pinimg.com/1200x/1d/20/2b/1d202bea3ca61a70ced6f540cb67ce5a.jpg',
      'https://i.pinimg.com/1200x/5a/5d/94/5a5d9491dd6cd02df00008a6344dd101.jpg',
      'https://i.pinimg.com/1200x/4d/c2/f8/4dc2f8b901e2a62ea2ae55d2f69d24a3.jpg',
      'https://i.pinimg.com/1200x/39/a5/6e/39a56e796c74efa0c601a48b8349e414.jpg',
      'https://i.pinimg.com/1200x/2d/1f/46/2d1f4608b8bfb22fddf1d34d834e436c.jpg'
    ],
    prompt: 'Corte Bixie (híbrido pixie + bob) aplicado respeitando a referência:\n- Comprimento: curto, entre pixie e bob, na altura da mandíbula ou orelha.\n- Topo: volumoso e texturizado, com fios soltos.\n- Laterais: curtas mas com comprimento suficiente para virar para trás.\n- Nuca: curta, ajustada, levemente desfiada.\n- Textura: desfiada, com pontas soltas e movimento.\n- Franja: curta, texturizada, com risco lateral.\n- Volume: no topo, criando altura e movimento.\n- Direção do caimento: para frente e para cima, com fios soltos.'
  },
  {
    id: 'soft-layers', cat: 'corte', corte: 'Soft', title: 'Camadas Longas',
    desc: 'Camadas contínuas sem marcação: efeito natural e fluido. Oval, redondo e retangular. Manutenção baixa, retoque a cada 12 semanas.',
    img: 'https://i.pinimg.com/1200x/e9/12/96/e91296a700072a42b4d9cfaafeb48ac7.jpg',
    variants: [
      'https://i.pinimg.com/736x/96/31/54/96315450669e7b501f2c3a3df3d22c64.jpg',
      'https://i.pinimg.com/736x/3f/8a/56/3f8a567393a8ec2e33a032171cc9da1e.jpg',
      'https://i.pinimg.com/736x/8c/7e/2a/8c7e2a5d9f1b4c3e6a8d2b7f5e9c1a48.jpg',
      'https://i.pinimg.com/736x/28/08/b2/2808b20872bdf2f4d592937b832e5ebe.jpg',
      'https://i.pinimg.com/736x/e4/33/c6/e433c67d4a72a7e0db4c09264b1db14f.jpg',
      'https://i.pinimg.com/1200x/6e/4c/c7/6e4cc792bb849c411c7c45d4ade6a5ba.jpg',
      'https://i.pinimg.com/1200x/34/30/d8/3430d8b60e48812a8e1f15426af803f9.jpg',
      'https://i.pinimg.com/736x/43/c4/93/43c493fa3eff0cc7588e361d3df8af14.jpg',
      'https://i.pinimg.com/736x/4a/6d/2f/4a6d2f8c1b5e9a3d7f2c6b4e8a1d5f93.jpg',
      'https://i.pinimg.com/736x/23/ed/1a/23ed1a0d684e9c188c09ae26b62ff6cb.jpg'
    ],
    prompt: 'Corte Soft Layers (camadas longas) aplicado respeitando a referência:\n- Comprimento: longo, abaixo dos ombros.\n- Camadas: contínuas, sem marcação visível, transição suave do topo às pontas.\n- Topo: liso com leve movimento natural.\n- Textura: fluida, natural, pontas soltas sem desfiado pesado.\n- Franja: sem franja ou camadas frontais longas emoldurando o rosto.\n- Volume: distribuído naturalmente, sem concentração.\n- Direção do caimento: reto com movimento suave, fluido.'
  },
  {
    id: 'modern-mullet', cat: 'corte', corte: 'Mullet', title: 'Laterais Curtas',
    desc: 'Contraste entre laterais curtas e nuca alongada. Oval, quadrado e alongado. Manutenção alta, retoque a cada 5 semanas.',
    img: 'https://i.pinimg.com/736x/20/58/ac/2058ac84b233324378f9e26d578ef819.jpg',
    variants: [
      'https://i.pinimg.com/236x/e6/a1/82/e6a1828757f3ecd53a78bdd550faaba6.jpg',
      'https://i.pinimg.com/1200x/19/ed/cf/19edcf705faee3021dca36773177f62a.jpg',
      'https://i.pinimg.com/1200x/16/64/f9/1664f9eaac25d965bc1c2d6741fda93b.jpg',
      'https://i.pinimg.com/1200x/27/d6/74/27d674710090918e0690581ebc8ef94e.jpg',
      'https://i.pinimg.com/1200x/cb/f4/f1/cbf4f1161d464c832dbb5293dd8de964.jpg',
      'https://i.pinimg.com/1200x/f8/70/24/f87024c447ec39609515b2290aff08bc.jpg',
      'https://i.pinimg.com/1200x/60/66/10/60661058bc83960f7d1f317c12ad2431.jpg',
      'https://i.pinimg.com/1200x/b1/80/77/b180775bb03e74077fe9d8c43f680032.jpg',
      'https://i.pinimg.com/736x/ff/53/32/ff5332897dac5127e398a301e47784b3.jpg',
      'https://i.pinimg.com/1200x/2f/92/d0/2f92d0c3dcfaaaaaab163894bd4a611d.jpg'
    ],
    prompt: 'Corte Modern Mullet aplicado respeitando a referência:\n- Comprimento: curto nas laterais e topo, longo na nuca (mullet moderno).\n- Topo: curto, texturizado, com movimento para frente.\n- Laterais: bem curtas, desfiadas, ajustadas à cabeça.\n- Nuca: alongada, com camadas longas que caem sobre o pescoço.\n- Textura: desfiada, pontas soltas.\n- Franja: curta, texturizada, com risco lateral.\n- Volume: no topo e na nuca, criando contraste.\n- Direção do caimento: topo para frente, nuca para baixo e para trás.'
  },
  {
    id: 'clavicut', cat: 'corte', corte: 'Clavicut', title: 'Altura da Clavícula',
    desc: 'Comprimento na clavícula: o mais longo dos bobs. Redondo, quadrado e alongado. Manutenção baixa, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/1200x/11/d9/e1/11d9e1a01d57ed8d1ea57700a636fa74.jpg',
    variants: [
      'https://i.pinimg.com/736x/f6/fd/10/f6fd109767ac8c5eecc8eff4627a29b4.jpg',
      'https://i.pinimg.com/1200x/15/70/d8/1570d81bf27679068906d1bbec402541.jpg',
      'https://i.pinimg.com/736x/80/64/7b/80647beb8342644f1b0495329ae5dc5b.jpg',
      'https://i.pinimg.com/736x/a2/0c/66/a20c660ee91fd4fff2e840bcce525cc2.jpg',
      'https://i.pinimg.com/1200x/c8/33/f1/c833f10c4eecb915aca10301cf52eb4c.jpg',
      'https://i.pinimg.com/736x/b6/ba/71/b6ba71ea65fb533b1844d0049d7ac88c.jpg',
      'https://i.pinimg.com/736x/60/aa/9e/60aa9e7c143839c1649eff734c960da5.jpg',
      'https://i.pinimg.com/736x/f0/6f/91/f06f91f9f0acf8d1535fcac16cca7748.jpg',
      'https://i.pinimg.com/736x/b1/9a/be/b19abe36509b85262bb0ef929323b10f.jpg',
      'https://i.pinimg.com/736x/38/6b/70/386b70f42ee9c113ebd832de0b3d7af0.jpg'
    ],
    prompt: 'Corte Clavicut aplicado respeitando a referência:\n- Comprimento: na altura da clavícula, mais longo que o lob.\n- Camadas: mínimas, apenas para dar movimento nas pontas.\n- Topo: liso, sem volume artificial.\n- Textura: alinhada, fluida, pontas soltas.\n- Franja: sem franja ou curtain bangs longas.\n- Volume: mínimo no topo, leve nas pontas.\n- Direção do caimento: reto com leve movimento natural.'
  },
  {
    id: 'octopus-cut', cat: 'corte', corte: 'Octopus', title: 'Topo Arredondado',
    desc: 'Topo redondo e volumoso com camadas longas e finas na base. Oval, redondo e coração. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/1200x/99/a7/7c/99a77c4f583bad5a0d1c9319f44ade9b.jpg',
    variants: [
      'https://i.pinimg.com/1200x/fe/b3/81/feb381a2026228724751dcf1770a61b8.jpg',
      'https://i.pinimg.com/736x/4e/ad/cc/4eadcc3c07ced2c32c6093d75c1667ff.jpg',
      'https://i.pinimg.com/736x/0c/9c/67/0c9c6782b990579ddbbe6fc28d341d75.jpg',
      'https://i.pinimg.com/1200x/3d/93/f6/3d93f6733e2577b5e83f98cbbdacfe9f.jpg',
      'https://i.pinimg.com/1200x/5d/48/92/5d489219e20ed97dabc8cfe59d1c0dcf.jpg',
      'https://i.pinimg.com/736x/00/71/f6/0071f65ebd3e8a6181c4c895462c9ba9.jpg',
      'https://i.pinimg.com/736x/c4/27/f5/c427f51e5840551ca2d5a42e38186485.jpg',
      'https://i.pinimg.com/1200x/30/9e/cb/309ecbbff1f7dff8b7fa402be710c0b1.jpg',
      'https://i.pinimg.com/736x/f6/fa/f4/f6faf40de98db74e25d1355ef012510c.jpg',
      'https://i.pinimg.com/736x/3c/f7/25/3cf7255b744af3c6fad16b48929493b7.jpg'
    ],
    prompt: 'Corte Octopus aplicado respeitando a referência:\n- Comprimento: médio, entre ombros e meio das costas.\n- Topo: curto, arredondado e volumoso, criando efeito "cabeça redonda".\n- Camadas: longas e finas na base, criando movimento tipo tentáculos.\n- Textura: fluida, pontas soltas.\n- Franja: sem franja ou camadas frontais curtas.\n- Volume: máximo no topo, mínimo na base.\n- Direção do caimento: para baixo com pontas soltas e movimento.'
  },
  {
    id: 'hush-cut', cat: 'corte', corte: 'Hush', title: 'Camadas Profundas',
    desc: 'Versão suave do shag: camadas wispy e franja fina. Oval, alongado e retangular. Manutenção média, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/7c/1b/0b/7c1b0bae28ed1074ae441064c1d40b0b.jpg',
    variants: [
      'https://i.pinimg.com/236x/27/65/7d/27657de35a3184d3bb88750265351f1e.jpg',
      'https://i.pinimg.com/736x/b0/2f/4f/b02f4f74b719d47b218c06dc1f19c224.jpg',
      'https://i.pinimg.com/736x/f0/8c/0e/f08c0e6a8009f431e0cee00ade8e28bb.jpg',
      'https://i.pinimg.com/736x/f5/db/b9/f5dbb925a567194db137be17148fb9af.jpg',
      'https://i.pinimg.com/736x/49/f2/5a/49f25a25d31fd2f7b8dca3f219559d9f.jpg',
      'https://i.pinimg.com/736x/2c/ff/3e/2cff3e43ed7e8559602509e135fc826b.jpg',
      'https://i.pinimg.com/736x/72/5f/a5/725fa532477651a17bcc070cd6d63c43.jpg',
      'https://i.pinimg.com/1200x/24/53/f0/2453f0e489e216491e4374d646bff696.jpg',
      'https://i.pinimg.com/1200x/d2/59/a6/d259a609279b2ede2980f3ee128d733f.jpg',
      'https://i.pinimg.com/1200x/87/7c/dd/877cddceab43b6a2b126e00b1f5c1ccf.jpg'
    ],
    prompt: 'Corte Hush aplicado respeitando a referência:\n- Comprimento: médio, entre queixo e ombros.\n- Camadas: profundas, wispy, mais suaves que o shag tradicional.\n- Topo: leve volume, fios soltos.\n- Textura: wispy, pontas finas e soltas.\n- Franja: fina, desfiada, emoldurando o rosto.\n- Volume: distribuído, com leve concentração no topo.\n- Direção do caimento: para frente e para os lados, suave.'
  },
  {
    id: 'curtain-bang', cat: 'corte', corte: 'Curtain', title: 'Franja Cortininha',
    desc: 'Franja dividida ao meio que emoldura o rosto. Redondo, quadrado e coração. Manutenção alta, retoque a cada 4 semanas.',
    img: 'https://i.pinimg.com/736x/c7/83/c4/c783c422b3a1b9b4a980b2c3a472118f.jpg',
    variants: [
      'https://i.pinimg.com/736x/ac/71/25/ac7125df02150a4f398ba23f8cb8e343.jpg',
      'https://i.pinimg.com/736x/00/36/fc/0036fc75d702f60260c763706898f947.jpg',
      'https://i.pinimg.com/736x/e1/69/0a/e1690a55e7cc557de8fc4d8d9a29b171.jpg',
      'https://i.pinimg.com/736x/a0/07/f5/a007f51006c175ee7019d7ba8922029f.jpg',
      'https://i.pinimg.com/1200x/10/75/c6/1075c68d4b35292480d95cea2225915f.jpg',
      'https://i.pinimg.com/1200x/8e/9b/88/8e9b8865119a4916a22b3546005dfe22.jpg',
      'https://i.pinimg.com/736x/2b/58/8f/2b588f820afd53270b38996609f090a8.jpg',
      'https://i.pinimg.com/736x/55/04/99/550499a1e9250d771ae1a51ce23eccd1.jpg',
      'https://i.pinimg.com/736x/11/1c/77/111c7701a0ceed64db41619a6041f7c8.jpg',
      'https://i.pinimg.com/736x/0d/0b/4f/0d0b4f4411cb47ae50337399c55bf918.jpg',
      'https://i.pinimg.com/236x/0c/53/77/0c53779e821b89d4fd13555db779b783.jpg'
    ],
    prompt: 'Corte com Curtain Bangs (franja cortininha) aplicado respeitando a referência:\n- Franja: dividida ao meio, com comprimento na altura das maçãs do rosto ou queixo, emoldurando o rosto.\n- Comprimento do cabelo: mantém o comprimento original da cliente, apenas integra a franja.\n- Camadas: frontais curtas que se conectam ao restante do cabelo.\n- Textura: fluida, com movimento natural.\n- Volume: leve nas laterais da franja.\n- Direção do caimento: para os lados, abrindo no centro da testa.'
  },
  {
    id: 'parisian-fringe', cat: 'corte', corte: 'Parisian', title: 'Bob Arredondado com Franja Texturizada',
    desc: 'Bob arredondado + franja texturizada: romântico e chique. Oval, coração e alongado. Manutenção alta, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/1200x/f3/90/60/f39060b00b2661fd7c071a5d47bbbc09.jpg',
    variants: [
      'https://i.pinimg.com/736x/43/c4/cc/43c4cc25480f779f66f7e2d2139d58f4.jpg',
      'https://i.pinimg.com/736x/78/d1/d4/78d1d43657dd0bbe8af73e9d27e4ae3e.jpg',
      'https://i.pinimg.com/736x/f3/e2/47/f3e24722fa5a0a41cab26cf07e35d5b0.jpg',
      'https://i.pinimg.com/736x/38/c4/69/38c4697c7756863f4bb682b0365b406e.jpg',
      'https://i.pinimg.com/736x/cb/5f/2e/cb5f2ed5996ba12a3d627eeb89a59143.jpg',
      'https://i.pinimg.com/736x/32/e0/0c/32e00c7e6dd5808b20f1f501d03c9eb8.jpg',
      'https://i.pinimg.com/736x/95/7d/ce/957dce3168b0b28a7fa887a318123426.jpg',
      'https://i.pinimg.com/736x/e0/1f/a7/e01fa757da495954e11a7d564aa36621.jpg',
      'https://i.pinimg.com/736x/b1/d5/e8/b1d5e8d496be0aa0d9033e1742d91831.jpg',
      'https://i.pinimg.com/736x/0f/17/97/0f1797b50fa870d18d32c417b460677f.jpg'
    ],
    prompt: 'Corte Parisian Bob com franja texturizada aplicado respeitando a referência:\n- Comprimento: bob arredondado na altura do queixo, levemente mais longo na frente.\n- Camadas: suaves, arredondando as pontas.\n- Topo: liso com leve volume natural.\n- Textura: pontas texturizadas com movimento suave.\n- Franja: texturizada, desfiada, cobrindo a testa de forma romântica.\n- Volume: leve, concentrado nas laterais.\n- Direção do caimento: arredondado com pontas viradas para dentro.\n- Acabamento: parisiense, romântico e chique.'
  },
  {
    id: 'milano-layered', cat: 'corte', corte: 'Milano', title: 'Camadas Longas com Brilho Espelhado',
    desc: 'Camadas longas com caimento denso e uniforme. Oval, alongado e retangular. Manutenção baixa, retoque a cada 12 semanas.',
    img: 'https://i.pinimg.com/736x/e4/a2/98/e4a2980910025f69802da870b53d03db.jpg',
    variants: [
      'https://i.pinimg.com/736x/02/6a/7f/026a7f2e233dcdbfd69213ced0a499d2.jpg',
      'https://i.pinimg.com/736x/c2/8b/50/c28b50596ad8708dc1af2bd12ca5f950.jpg',
      'https://i.pinimg.com/736x/17/6b/7c/176b7ca842d4f05fc232e6c4950fb67d.jpg',
      'https://i.pinimg.com/736x/6a/c1/97/6ac197acb1d9a35650cda0d7b221e3bb.jpg',
      'https://i.pinimg.com/736x/56/44/aa/5644aa042553d9be35f7f0f92a9ea046.jpg',
      'https://i.pinimg.com/736x/88/27/2c/88272c86c739b50408bc6372972a7dba.jpg',
      'https://i.pinimg.com/736x/cb/5b/bd/cb5bbde7a812d11c8b856ddfad8037c6.jpg',
      'https://i.pinimg.com/736x/ba/47/41/ba4741fa467ada18d1e9662f8940bd6f.jpg',
      'https://i.pinimg.com/736x/a7/fa/d7/a7fad7690ef102971c469596a26464c0.jpg',
      'https://i.pinimg.com/736x/45/84/d0/4584d0c441b4c7059f4dd1fd6e02046c.jpg'
    ],
    prompt: 'Corte Milano (camadas longas com brilho espelhado) aplicado respeitando a referência:\n- Comprimento: longo, abaixo dos ombros.\n- Camadas: longas e uniformes, com caimento denso.\n- Topo: liso, sem volume artificial.\n- Textura: alinhada, com brilho espelhado, pontas densas.\n- Franja: sem franja ou camadas frontais longas.\n- Volume: distribuído uniformemente, sem picos.\n- Direção do caimento: reto, denso, com movimento suave.'
  },
  {
    id: 'brazilian-beach-wave', cat: 'corte', corte: 'Brazilian', title: 'Long Bob com Ondas Tropicais',
    desc: 'Long bob + ondas largas: textura tropical desestruturada. Oval, redondo e coração. Manutenção média, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/3c/7f/9a/3c7f9a2e5b8d1c4f6a9e3b7d2c5f8a14.jpg',
    variants: [
      'https://i.pinimg.com/736x/8a/2e/6c/8a2e6c9f4b7d1e5a3c8f2b6d9e4a7c31.jpg',
      'https://i.pinimg.com/736x/1f/9c/4d/1f9c4d8b2e6a3f7c5b9e1d4a8f6c2e75.jpg',
      'https://i.pinimg.com/736x/6b/3d/8f/6b3d8f1c5a9e4b7d2f6c3a8e1d5b9f42.jpg',
      'https://i.pinimg.com/736x/4e/7a/2b/4e7a2b9d6c1f8a5e3b7d4c2f9a6e1b58.jpg',
      'https://i.pinimg.com/736x/9d/1f/5c/9d1f5c8e3b7a2d6f4c1e9b5d8a3f7c26.jpg',
      'https://i.pinimg.com/736x/2c/6e/9a/2c6e9a4f7d1b5c8e3a6f2b9d4c7e1a83.jpg',
      'https://i.pinimg.com/736x/7f/4b/1d/7f4b1d9e6a2c5f8b3d7e4a1c6f9b2d57.jpg',
      'https://i.pinimg.com/736x/5a/8c/3e/5a8c3e7b1f4d9a6c2e8b5f3d1a7c4e94.jpg',
      'https://i.pinimg.com/736x/1b/4d/7f/1b4d7f2a9c5e8b3d6f1a4c7e9b2d5f38.jpg',
      'https://i.pinimg.com/736x/8e/3a/6c/8e3a6c1f9d4b7e2a5c8f3b6d1e9a4c71.jpg'
    ],
    prompt: 'Corte Brazilian Beach Wave (long bob com ondas tropicais) aplicado respeitando a referência:\n- Comprimento: long bob, entre ombros e meio das costas.\n- Ondas: largas, desestruturadas, efeito "praia".\n- Camadas: longas para acomodar as ondas.\n- Textura: ondulada natural, com movimento tropical.\n- Franja: sem franja ou camadas frontais longas.\n- Volume: distribuído, com movimento natural.\n- Direção do caimento: ondulado, fluido, com pontas soltas.'
  },
  {
    id: 'riviera-pixie', cat: 'corte', corte: 'Riviera', title: 'Pixie com Topo Longo e Maleável',
    desc: 'Laterais bem curtas + topo longo e maleável. Oval, coração e triângulo invertido. Manutenção alta, retoque a cada 5 semanas.',
    img: 'https://i.pinimg.com/736x/6c/1f/8d/6c1f8d4b9a2e7c5f3b8d1a6e4c9f2b73.jpg',
    variants: [
      'https://i.pinimg.com/736x/3f/8a/5c/3f8a5c2e7b9d4f1a6c3e8b5d2f7a9c41.jpg',
      'https://i.pinimg.com/736x/9a/2e/6d/9a2e6d1f5b8c3a7e4d9f2b6c1a8e5d74.jpg',
      'https://i.pinimg.com/736x/1d/7c/4e/1d7c4e9a3f6b2d8c5e1a7f4b9d3c6e28.jpg',
      'https://i.pinimg.com/736x/8b/5f/2a/8b5f2a7d1c4e9b6f3d8a5c2e7b4d1f95.jpg',
      'https://i.pinimg.com/736x/4e/9a/6c/4e9a6c1d5b8f3e7a2d6c9b4f1a7e3d52.jpg',
      'https://i.pinimg.com/736x/2c/6e/8b/2c6e8b4d9a1f7c5e3b8d6a2f4c9e1b36.jpg',
      'https://i.pinimg.com/736x/7a/1d/5f/7a1d5f9c4b2e8a6d3f1c7b5e9d2a4f18.jpg',
      'https://i.pinimg.com/736x/5f/8c/3a/5f8c3a6e2b9d4f7a1c8e5b3d6f2a9c47.jpg',
      'https://i.pinimg.com/736x/1a/4e/7d/1a4e7d3c9b6f2a5e8d1c4b7f3e9a6d82.jpg',
      'https://i.pinimg.com/736x/9c/7a/2e/9c7a2e5f1d8b4c6a3f9d7b1e4c8a5f63.jpg'
    ],
    prompt: 'Corte Riviera Pixie (topo longo e maleável) aplicado respeitando a referência:\n- Comprimento: curto nas laterais, mais longo no topo (pixie com topo maleável).\n- Topo: longo, com fios que caem para o lado, movimento natural.\n- Laterais: bem curtas, ajustadas à cabeça.\n- Nuca: curta, arredondada.\n- Textura: maleável, com movimento solto.\n- Franja: longa lateral, caindo sobre a testa.\n- Volume: no topo, criando altura e movimento.\n- Direção do caimento: para o lado e para frente.'
  },
  {
    id: 'bob-desfiado', cat: 'corte', corte: 'Shag', title: 'Long Bob com Textura',
    desc: 'Pontas desfiadas com camadas leves. Oval, quadrado e alongado. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/9e/2b/5d/9e2b5d8a4c1f7e3b6d9a2c5f8e4b1d73.jpg',
    variants: [
      'https://i.pinimg.com/736x/4a/8f/2c/4a8f2c6d9b3e7a1f5c8d4b2e6a9f3c15.jpg',
      'https://i.pinimg.com/736x/7c/1e/5a/7c1e5a9d4b8f2c6e3a7d1b5f8c4e2a96.jpg',
      'https://i.pinimg.com/736x/2d/6a/8c/2d6a8c4f7b1e9a5d3c8f2b6e4a7d1c48.jpg',
      'https://i.pinimg.com/736x/8f/3b/7e/8f3b7e1a5c9d4f2b6e8a3c7d1f5b9e62.jpg',
      'https://i.pinimg.com/736x/5c/9d/2f/5c9d2f6b8a4e1c7d3f9b5a2e6c8d4f37.jpg',
      'https://i.pinimg.com/736x/1e/4b/7d/1e4b7d3a9f6c2e8b5d1a4f7c3e9b6d84.jpg',
      'https://i.pinimg.com/736x/6f/2c/9e/6f2c9e5b1d8a4f7c3e6b2a9d5f1c8e53.jpg',
      'https://i.pinimg.com/736x/3a/7f/1c/3a7f1c8d5b2e9a6f4c1d7b3e8a5f2c71.jpg',
      'https://i.pinimg.com/736x/9b/4e/2a/9b4e2a7c1f5d8b3e6a9c4f2d7b1e5a26.jpg',
      'https://i.pinimg.com/736x/2e/8a/6c/2e8a6c3f9b4d1e7a5c2f8b6d3e9a1c47.jpg'
    ],
    prompt: 'Corte Long Bob Desfiado (shag) aplicado respeitando a referência:\n- Comprimento: long bob, entre ombros e meio das costas.\n- Camadas: leves, desfiadas, criando movimento.\n- Topo: leve volume, fios soltos.\n- Textura: desfiada nas pontas, movimento solto.\n- Franja: sem franja ou camadas frontais curtas.\n- Volume: distribuído, com leve concentração no topo.\n- Direção do caimento: para frente e para os lados.'
  },
  {
    id: 'curly-shag', cat: 'corte', corte: 'Curly', title: 'Camadas para Cacheados',
    desc: 'Shag adaptado para cacheados: valoriza a curvatura. Oval, redondo e coração. Manutenção média, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/7c/4a/9e/7c4a9e2d6b8f3a1c5e9b4d7f2a6c8e13.jpg',
    variants: [
      'https://i.pinimg.com/736x/2b/8d/5f/2b8d5f9a3c7e1b6d4a8f2c9e5b7d3a41.jpg',
      'https://i.pinimg.com/736x/6e/1c/8a/6e1c8a4d7b2f9e5c3a8d1b6f4e9c2a75.jpg',
      'https://i.pinimg.com/736x/9a/4f/2c/9a4f2c7e1b5d8a3f6c9e4b2d7a5f1c83.jpg',
      'https://i.pinimg.com/736x/4d/7b/9e/4d7b9e3c6a1f8d5b2e9c4a7f3d6b1e58.jpg',
      'https://i.pinimg.com/736x/1e/5a/8c/1e5a8c2f7b4d9e6a3c1f8b5d2e7a4c96.jpg',
      'https://i.pinimg.com/736x/8c/2f/6d/8c2f6d9a4b7e1c5f3a8d6b2e9c4f7a14.jpg',
      'https://i.pinimg.com/736x/3f/9a/1b/3f9a1b6c4e8d2f7a5b9c3e1d6f4a8b27.jpg',
      'https://i.pinimg.com/736x/7a/4c/8e/7a4c8e1d5b9f2a6c3e7b4d1f8a5c2e63.jpg',
      'https://i.pinimg.com/736x/5c/8e/2a/5c8e2a7d1f4b9c6e3a8d5f2b7e4c1a39.jpg',
      'https://i.pinimg.com/736x/2a/6d/9c/2a6d9c4f8b1e5a3d7f2c6b9e4a1d7f85.jpg'
    ],
    prompt: 'Corte Curly Shag (camadas para cacheados) aplicado respeitando a referência:\n- Comprimento: médio, entre queixo e ombros.\n- Camadas: adaptadas para valorizar a curvatura natural dos cachos.\n- Topo: volume natural dos cachos.\n- Textura: cacheada, definida, com movimento.\n- Franja: cacheada, emoldurando o rosto.\n- Volume: distribuído, respeitando o volume natural.\n- Direção do caimento: seguindo a curvatura natural dos cachos.'
  },
  {
    id: 'micro-bob', cat: 'corte', corte: 'Micro', title: 'Chanel Minimalista',
    desc: 'Acima do maxilar: o mais curto dos bobs. Oval, coração e alongado. Manutenção alta, retoque a cada 4 semanas.',
    img: 'https://i.pinimg.com/736x/2d/8a/5c/2d8a5c7e4b1f9a6d3c8e2b5f7a4d1c93.jpg',
    variants: [
      'https://i.pinimg.com/736x/6f/3b/9d/6f3b9d2e5c8a4f1b7d3e6c9a2f5b8d41.jpg',
      'https://i.pinimg.com/736x/9e/1c/7a/9e1c7a4d6b2f8e5c3a9d1b7f4e2c6a85.jpg',
      'https://i.pinimg.com/736x/4a/8f/2d/4a8f2d6c9b3e7a1f5d8c4b2e9a6f3d17.jpg',
      'https://i.pinimg.com/736x/8c/5e/1b/8c5e1b7a3d9f4c2e6b8a5d1f7c3e9b24.jpg',
      'https://i.pinimg.com/736x/3b/9d/6f/3b9d6f2a8c4e1b7d5a9f3c6e2b8d4a51.jpg',
      'https://i.pinimg.com/736x/7d/2a/8f/7d2a8f5c1b9e4d6a3f7c2b8e5d1a9f36.jpg',
      'https://i.pinimg.com/736x/1f/6c/4a/1f6c4a9d7b3e8f2c5a1d6b9e4f7c2a83.jpg',
      'https://i.pinimg.com/736x/5a/9e/3b/5a9e3b8d1f6c4a2e7b9d5f3c1a8e6b47.jpg',
      'https://i.pinimg.com/736x/9d/4b/7e/9d4b7e2c6a1f8d5b3e9c7a4f2d6b1e58.jpg',
      'https://i.pinimg.com/736x/2e/7a/5c/2e7a5c9f3b6d1e8a4c7f2b5d9e3a6c71.jpg'
    ],
    prompt: 'Corte Micro Bob (chanel minimalista) aplicado respeitando a referência:\n- Comprimento: acima do maxilar, bem curto.\n- Camadas: zero ou mínimas.\n- Topo: liso, sem volume artificial.\n- Textura: alinhada, densa.\n- Franja: sem franja ou franja reta curta.\n- Volume: mínimo, fios alinhados.\n- Direção do caimento: reto com pontas viradas levemente para dentro.'
  },
  {
    id: 'wavy-bob', cat: 'corte', corte: 'Wavy', title: 'Long Bob Ondulado',
    desc: 'Long bob + ondas suaves: elegante e despretensioso. Oval, redondo e quadrado. Manutenção baixa, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/736x/6c/1f/8d/6c1f8d4b9a2e7c5f3b8d1a6e4c9f2b73.jpg',
    variants: [
      'https://i.pinimg.com/736x/3f/8a/5c/3f8a5c2e7b9d4f1a6c3e8b5d2f7a9c41.jpg',
      'https://i.pinimg.com/736x/9a/2e/6d/9a2e6d1f5b8c3a7e4d9f2b6c1a8e5d74.jpg',
      'https://i.pinimg.com/736x/1d/7c/4e/1d7c4e9a3f6b2d8c5e1a7f4b9d3c6e28.jpg',
      'https://i.pinimg.com/736x/8b/5f/2a/8b5f2a7d1c4e9b6f3d8a5c2e7b4d1f95.jpg',
      'https://i.pinimg.com/736x/4e/9a/6c/4e9a6c1d5b8f3e7a2d6c9b4f1a7e3d52.jpg',
      'https://i.pinimg.com/736x/2c/6e/8b/2c6e8b4d9a1f7c5e3b8d6a2f4c9e1b36.jpg',
      'https://i.pinimg.com/736x/7a/1d/5f/7a1d5f9c4b2e8a6d3f1c7b5e9d2a4f18.jpg',
      'https://i.pinimg.com/736x/5f/8c/3a/5f8c3a6e2b9d4f7a1c8e5b3d6f2a9c47.jpg',
      'https://i.pinimg.com/736x/1a/4e/7d/1a4e7d3c9b6f2a5e8d1c4b7f3e9a6d82.jpg',
      'https://i.pinimg.com/736x/9c/7a/2e/9c7a2e5f1d8b4c6a3f9d7b1e4c8a5f63.jpg'
    ],
    prompt: 'Corte Wavy Long Bob (ondulado suave) aplicado respeitando a referência:\n- Comprimento: long bob, entre ombros e meio das costas.\n- Ondas: suaves, elegantes, despretensiosas.\n- Camadas: longas para acomodar as ondas.\n- Textura: ondulada natural, fluida.\n- Franja: sem franja ou camadas frontais longas.\n- Volume: distribuído naturalmente.\n- Direção do caimento: ondulado, fluido.'
  },
  {
    id: 'layered-pixie', cat: 'corte', corte: 'Layered', title: 'Pixie com Camadas Longas',
    desc: 'Camadas longas no topo: versátil e cresce bem. Oval, coração e triângulo invertido. Manutenção média, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/736x/7e/3a/9c/7e3a9c1f4b8d2e6a5c7f3b1d9e4a6c28.jpg',
    variants: [
      'https://i.pinimg.com/736x/2c/7f/5a/2c7f5a9d3b6e1c8f4a7d2b5e9c3f6a14.jpg',
      'https://i.pinimg.com/736x/9d/4b/2e/9d4b2e7c1f5a8d3b6e9c4f2a7d5b1e86.jpg',
      'https://i.pinimg.com/736x/5a/8e/1c/5a8e1c6f3b9d4a7e2c5f8b1d6e3a9c47.jpg',
      'https://i.pinimg.com/736x/3b/6d/9f/3b6d9f2a5c8e1b4d7a3f6c9e2b5d8a71.jpg',
      'https://i.pinimg.com/736x/1c/4a/7e/1c4a7e3d9b6f2a5e8c1d4b7f3e9a6d52.jpg',
      'https://i.pinimg.com/736x/8f/2b/5d/8f2b5d9a1c4e7b3f6a8d2c5e9b1f4a37.jpg',
      'https://i.pinimg.com/736x/4e/7c/1a/4e7c1a8d5b9f2e6c3a7d4b1f8e5c2a63.jpg',
      'https://i.pinimg.com/736x/6a/9d/3b/6a9d3b7e1c5f8a4d2b6e9c1f5a7d3b48.jpg',
      'https://i.pinimg.com/736x/2f/5b/8e/2f5b8e4a7d1c6f3b9d2a5c8e1f4b7d95.jpg',
      'https://i.pinimg.com/736x/7d/1a/4c/7d1a4c8f2b6e9d5a3c7f1b4e8d2a5c26.jpg'
    ],
    prompt: 'Corte Layered Pixie (camadas longas no topo) aplicado respeitando a referência:\n- Comprimento: curto nas laterais, mais longo no topo.\n- Topo: camadas longas, versáteis, que crescem bem.\n- Laterais: curtas, ajustadas.\n- Nuca: curta, arredondada.\n- Textura: maleável, com movimento.\n- Franja: camadas laterais longas.\n- Volume: no topo, criando movimento.'
  },
  {
    id: 'kitty-cut', cat: 'corte', corte: 'Kitty', title: 'Bob-Shag Fluido na Altura dos Ombros',
    desc: 'Bob-shag híbrido: base reta + camadas desconectadas que só aparecem no movimento. Oval, redondo e alongado. Manutenção média, retoque a cada 10 semanas.',
    img: 'https://i.pinimg.com/1200x/14/1c/a1/141ca123597b6962ddde805e87d9d0d3.jpg',
    variants: [
      'https://i.pinimg.com/736x/6c/73/a4/6c73a4e52df16ad5a56b701ad63b37b2.jpg',
      'https://i.pinimg.com/736x/02/d2/ad/02d2adc1433a0b74f7f1c27ecd9a3e7f.jpg',
      'https://i.pinimg.com/736x/02/3e/27/023e27ef76fa501e627b07389efe7d99.jpg',
      'https://i.pinimg.com/736x/92/0e/01/920e013dd5bae141dccdac33c3bb6a5b.jpg',
      'https://i.pinimg.com/1200x/24/ec/e1/24ece1826fc5b814072cf090bff9c86e.jpg',
      'https://i.pinimg.com/736x/05/18/88/05188821bb2b5bfaf65cc303ce4e6b28.jpg',
      'https://i.pinimg.com/1200x/d3/51/06/d35106b0a9e94122641f383b7e40a391.jpg',
      'https://i.pinimg.com/736x/4b/d6/15/4bd615722ed82b1b4214ace23965a7b5.jpg',
      'https://i.pinimg.com/736x/e8/2a/91/e82a91fb3b2015536d8a348714141b1f.jpg',
      'https://i.pinimg.com/736x/44/a5/5a/44a55a3e2482ac313cc34e9c3af37145.jpg'
    ],
    prompt: 'Corte Kitty (bob-shag híbrido) aplicado respeitando a referência:\n- Comprimento: na altura dos ombros, fluido.\n- Base: reta, precisa.\n- Camadas: desconectadas, que só aparecem no movimento.\n- Topo: leve volume, fios soltos.\n- Textura: fluida, movimento suave.\n- Franja: sem franja ou camadas frontais curtas.\n- Volume: distribuído, com leve concentração no topo.\n- Direção do caimento: fluido, com movimento.'
  },
  {
    id: 'side-cut', cat: 'corte', corte: 'Sidecut', title: 'Desconexão Lateral com Contraste Marcado',
    desc: 'Lateral raspada: contraste máximo e atitude urbana. Oval, quadrado e coração. Manutenção alta, retoque a cada 4 semanas.',
    img: 'https://i.pinimg.com/1200x/de/4d/24/de4d244b7955694a245cfdb0d916a70c.jpg',
    variants: [
      'https://i.pinimg.com/1200x/dd/33/25/dd3325325c0c52ff69a73cf687686e7f.jpg',
      'https://i.pinimg.com/736x/0b/4e/b0/0b4eb0e120545c32c4511a7b3b5cbb95.jpg',
      'https://i.pinimg.com/1200x/70/b0/3b/70b03bac67d866dde1a30f2f17928cc9.jpg',
      'https://i.pinimg.com/1200x/0c/48/3e/0c483e956a923ef406a14e970cd490b7.jpg',
      'https://i.pinimg.com/1200x/4d/1a/1a/4d1a1a3015b58eaf00bf56f09fdbd1f9.jpg',
      'https://i.pinimg.com/736x/ca/0e/93/ca0e93cc463fd03fff7db794ae1994af.jpg',
      'https://i.pinimg.com/236x/b4/2e/96/b42e9601015195a7057613d43724dae0.jpg',
      'https://i.pinimg.com/1200x/3a/8c/00/3a8c000a3265e2c72db69da805857bca.jpg',
      'https://i.pinimg.com/1200x/0d/0b/a0/0d0ba0d75b7b23bf945cc9b91c588dab.jpg',
      'https://i.pinimg.com/1200x/3a/a8/9f/3aa89f20df0421b46aeedc5d4bbcb10c.jpg'
    ],
    prompt: 'Corte Sidecut (desconexão lateral) aplicado respeitando a referência:\n- Contraste: lateral raspada (máquina) + restante do cabelo longo.\n- Comprimento: longo do lado oposto, com camadas.\n- Topo: leve volume, fios caem para o lado oposto à raspagem.\n- Textura: fios longos e soltos.\n- Franja: camadas laterais longas cobrindo parcialmente.\n- Volume: no lado longo, criando contraste.\n- Direção do caimento: para o lado oposto à raspagem.'
  },
  {
    id: 'long-pixie', cat: 'corte', corte: 'Long Pixie', title: 'Pixie com Zonas Alta e Frontal Alongadas',
    desc: 'Zonas alta e frontal longas: o mais longo dos pixies. Oval, coração e triângulo invertido. Manutenção média, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/1200x/db/4f/81/db4f816a70651d7b8864a9ff79df6acb.jpg',
    variants: [
      'https://i.pinimg.com/736x/fc/c5/68/fcc568fcce15a692ef2eafce1d4e21af.jpg',
      'https://i.pinimg.com/736x/94/82/6f/94826f9fe637a42381f75525b307d87f.jpg',
      'https://i.pinimg.com/736x/66/39/15/66391544dabf1459a61a878f9e63a70e.jpg',
      'https://i.pinimg.com/1200x/fe/e3/cd/fee3cd37d023a8ef22a96b6a37b3539e.jpg',
      'https://i.pinimg.com/736x/47/b3/fb/47b3fb31012603b107d18a14a775b4ab.jpg',
      'https://i.pinimg.com/736x/61/48/e7/6148e7c2a443c6f5afe1fbfadbbda8a5.jpg',
      'https://i.pinimg.com/736x/65/78/b3/6578b3b6059c7f259d402de2b93ddb3f.jpg',
      'https://i.pinimg.com/1200x/2a/e6/4b/2ae64b5f9a21eb8d7fa0d57528851a2a.jpg',
      'https://i.pinimg.com/1200x/9a/d2/1e/9ad21e5dde1d86da9bcd051e29cecdee.jpg',
      'https://i.pinimg.com/1200x/fc/39/d6/fc39d673b0eaaba1709b3f32a2951b56.jpg'
    ],
    prompt: 'Corte Long Pixie aplicado respeitando a referência:\n- Comprimento: curto, mas com zonas alta e frontal alongadas (o mais longo dos pixies).\n- Topo: longo, com fios que caem para o lado.\n- Laterais: curtas, mas com comprimento suficiente para virar atrás da orelha.\n- Nuca: curta, ajustada.\n- Textura: maleável, movimento solto.\n- Franja: longa lateral, caindo sobre a testa.\n- Volume: no topo e nas laterais, criando movimento.\n- Direção do caimento: para o lado e para frente.'
  },
  {
    id: 'curly-bob', cat: 'corte', corte: 'Coily', title: 'Bob Cacheado Arredondado',
    desc: 'Volume arredondado + cachos definidos: para cacheados. Oval, alongado e retangular. Manutenção média, retoque a cada 8 semanas.',
    img: 'https://i.pinimg.com/736x/1b/b9/46/1bb9462f667f122ff09fbf65e46105e1.jpg',
    variants: [
      'https://i.pinimg.com/736x/d5/8b/68/d58b688061c24a0c99820580c0046d3f.jpg',
      'https://i.pinimg.com/736x/d2/70/9f/d2709f314728cbf66039a6dbe69c451a.jpg',
      'https://i.pinimg.com/1200x/ed/9c/9f/ed9c9f657706a7ba3a62d53601371202.jpg',
      'https://i.pinimg.com/736x/a7/8a/e2/a78ae223933fef1a092cbe01a9c22a16.jpg',
      'https://i.pinimg.com/736x/76/0c/4b/760c4be9742c6450afc0eeb63700a39c.jpg',
      'https://i.pinimg.com/736x/dc/96/54/dc9654250bf4f72c028310d5911dde09.jpg',
      'https://i.pinimg.com/736x/fb/ef/6e/fbef6eecc64d0787e0065e001962ac8f.jpg',
      'https://i.pinimg.com/736x/2d/69/24/2d6924d08fd1c0e12b9e3e01537bb585.jpg',
      'https://i.pinimg.com/1200x/08/37/04/083704ac74c7e0a8c08735ea45469e90.jpg',
      'https://i.pinimg.com/736x/30/6a/98/306a9837d67ea1def17c30d76f2ef76d.jpg'
    ],
    prompt: 'Corte Curly Bob (bob cacheado arredondado) aplicado respeitando a referência:\n- Comprimento: bob na altura do queixo ou ombros.\n- Cachos: definidos, volumosos, arredondados.\n- Camadas: adaptadas para valorizar os cachos.\n- Topo: volume natural dos cachos.\n- Textura: cacheada, definida.\n- Franja: cacheada, emoldurando o rosto.\n- Volume: arredondado, máximo nas laterais.\n- Direção do caimento: seguindo a curvatura natural dos cachos.'
  },
  {
    id: 'asymmetric-cut', cat: 'corte', corte: 'Asymmetric', title: 'Corte Assimétrico com Lados Diferentes',
    desc: 'Lados deliberadamente diferentes: movimento assimétrico. Oval, redondo e coração. Manutenção alta, retoque a cada 6 semanas.',
    img: 'https://i.pinimg.com/236x/de/f5/a3/def5a3a55b260e9e25250fa02efc9a97.jpg',
    variants: [
      'https://i.pinimg.com/736x/6d/cd/16/6dcd166e935626302ca928759ddd33dd.jpg',
      'https://i.pinimg.com/736x/5b/ac/23/5bac230abb25c3a9dd94c4ad2344c33a.jpg',
      'https://i.pinimg.com/736x/3f/11/27/3f1127de905277a8483583ea6c16243a.jpg',
      'https://i.pinimg.com/1200x/f2/9e/1b/f29e1b5b8016562281007ad2e5391740.jpg',
      'https://i.pinimg.com/1200x/0a/18/77/0a18779bcfebf97444ddfdb9f0d76fbf.jpg',
      'https://i.pinimg.com/736x/4e/37/57/4e3757c1e8b80a5d625dd96b02de392f.jpg',
      'https://i.pinimg.com/736x/da/88/e1/da88e17a8339b416035bc33d6878199a.jpg',
      'https://i.pinimg.com/1200x/51/7c/58/517c5886bdbe74eed2cdea41680a5f80.jpg',
      'https://i.pinimg.com/1200x/96/54/84/965484971ae65dfe821188da0cce63d1.jpg',
      'https://i.pinimg.com/1200x/c0/58/24/c058246ac282d0506c17ed59ca940f8e.jpg'
    ],
    prompt: 'Corte Assimétrico aplicado respeitando a referência:\n- Lados: deliberadamente diferentes (um curto, outro longo).\n- Comprimento: varia entre curto e médio/longo, conforme referência.\n- Camadas: adaptadas a cada lado para criar movimento assimétrico.\n- Topo: leve volume, fios caem para o lado.\n- Textura: fluida, movimento assimétrico.\n- Franja: assimétrica, cobrindo parcialmente a testa.\n- Volume: distribuído de forma assimétrica.\n- Direção do caimento: para um dos lados, criando movimento.'
  }
];


// ============================================================
// 6. DADOS: COLORAÇÕES (25 itens com prompt individual)
// ============================================================
var coloracoesData = [
  {
    id: 'ombre-tiger-eye', cat: 'coloracao', corte: 'Tiger Eye', title: 'Transição Dourada',
    desc: 'Degradê quente do escuro ao dourado que ilumina o rosto e alonga o visual. Ex.: base 5.0/6.0 + mechas 8.3/9.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/1200x/fc/77/96/fc7796a5b8212a0fd41f43792ede5351.jpg',
    variants: [
      'https://i.pinimg.com/1200x/fc/77/96/fc7796a5b8212a0fd41f43792ede5351.jpg',
      'https://i.pinimg.com/736x/45/26/d3/4526d3bd85f723c62b5d376a21575ae5.jpg',
      'https://i.pinimg.com/736x/80/f3/bb/80f3bbce1fb5bb37fd8c921cd8ada7d2.jpg',
      'https://i.pinimg.com/736x/45/9c/a1/459ca1eba3cc70bc50f8414b1490a0b0.jpg',
      'https://i.pinimg.com/736x/cd/3c/0e/cd3c0ef3f5b2a4ec9c4e8b1e110b46ba.jpg',
      'https://i.pinimg.com/736x/81/b3/e3/81b3e38fcd2c99d11e48657daad65c74.jpg',
      'https://i.pinimg.com/236x/3c/ef/b5/3cefb5c8bcf36f31e91ccad6f55c79f5.jpg',
      'https://i.pinimg.com/736x/2b/93/62/2b936201040763501177f1cc4c1106c3.jpg',
      'https://i.pinimg.com/736x/ca/96/e9/ca96e93dd930794dfc51755adcc831bf.jpg',
      'https://i.pinimg.com/736x/41/c0/6d/41c06d6ed54a7b4605c5aa131a7b14b7.jpg'
    ],
    prompt: 'Coloração Ombré Tiger Eye aplicada respeitando a referência:\n- Técnica: ombré com transição degradê do escuro (raiz) ao dourado (pontas).\n- Base: tom 5.0/6.0 (castanho escuro natural) na raiz.\n- Mechas: 8.3/9.3 (loiro dourado) concentradas nas pontas, criando efeito "olho de tigre".\n- Profundidade: transição suave e quente, do escuro ao claro.\n- Subtom: quente/dourado, com reflexos luminosos.\n- Efeito desejado: iluminar o rosto e alongar o visual.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'babylights-morena', cat: 'coloracao', corte: 'Babylights', title: 'Luzes Finíssimas',
    desc: 'Luzes finíssimas que imitam o efeito natural do sol com crescimento suave. Ex.: base 4.0/5.0 + babylights 7.3/8.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/1200x/37/c9/1c/37c91cbb94c03b8a37157bf367a3dfbc.jpg',
    variants: [
      'https://i.pinimg.com/736x/69/c8/3b/69c83bfd72fd3022f6a6dc49b2b3f232.jpg',
      'https://i.pinimg.com/1200x/66/33/b3/6633b3d5f27363ed895a7cb870e20c78.jpg',
      'https://i.pinimg.com/736x/dd/7d/8e/dd7d8e39cea64d3f335fe067c8dd14b2.jpg',
      'https://i.pinimg.com/736x/f6/17/b5/f617b5b262544bb7a6f482f18d362487.jpg',
      'https://i.pinimg.com/1200x/e4/4b/da/e44bdac8a5105bfec972ba9a543bfeec.jpg',
      'https://i.pinimg.com/736x/0e/dc/3a/0edc3a3d742bbce816f8a7b9948c3422.jpg',
      'https://i.pinimg.com/736x/6e/08/7f/6e087fe54324ae27e3179a1f51db537c.jpg',
      'https://i.pinimg.com/736x/62/56/a8/6256a87f0bc5ce4ad04e5008e3e75c3c.jpg',
      'https://i.pinimg.com/736x/04/72/2d/04722d69e14755a8c25950f0da9adff3.jpg',
      'https://i.pinimg.com/1200x/b3/4a/0b/b34a0be19ad5436bcfd2dea58da00f6e.jpg'
    ],
    prompt: 'Coloração Babylights aplicada respeitando a referência:\n- Técnica: babylights — luzes finíssimas, muito próximas, que imitam o efeito natural do sol.\n- Base: tom 4.0/5.0 (castanho médio).\n- Mechas: 7.3/8.3 (loiro dourado) distribuídas uniformemente.\n- Crescimento: suave e discreto, sem marcação.\n- Subtom: quente/dourado, natural.\n- Efeito desejado: cabelo iluminado naturalmente, como se tivesse pego sol.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'contour-highlights', cat: 'coloracao', corte: 'Contour', title: 'Luzes Estratégicas',
    desc: 'Luzes posicionadas para iluminar e valorizar o formato do rosto. Ex.: contorno 8.3/9.0 ou 7.3 + 8.0. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/736x/a2/8b/0d/a28b0d206e5cc72f3ba38aafa9ad8031.jpg',
    variants: [
      'https://i.pinimg.com/736x/81/cf/e1/81cfe196df3e580425a842f6af8f12e3.jpg',
      'https://i.pinimg.com/736x/30/0a/83/300a83dfb89f41edbeb57061216538f4.jpg',
      'https://i.pinimg.com/1200x/41/4f/e3/414fe3a069ba01def6a66d44ac222636.jpg',
      'https://i.pinimg.com/1200x/7f/35/f9/7f35f9d6ed44ca283c69bb674019aa2d.jpg',
      'https://i.pinimg.com/736x/56/3a/da/563ada1310e02123d3c9d1c64f102693.jpg',
      'https://i.pinimg.com/736x/4c/e8/9f/4ce89fee713b38688226ea540639b201.jpg',
      'https://i.pinimg.com/736x/7c/e6/f9/7ce6f9523c7282634f3a2adcb4e2cdd8.jpg',
      'https://i.pinimg.com/1200x/0e/bb/1f/0ebb1f1251107bde521cc59d5fc1b116.jpg',
      'https://i.pinimg.com/736x/ad/b1/ff/adb1ffeb0f07b5696705dae265aaff22.jpg',
      'https://i.pinimg.com/1200x/aa/cb/cf/aacbcffaf13927ee047eabcbda8cc1aa.jpg'
    ],
    prompt: 'Coloração Contour Highlights aplicada respeitando a referência:\n- Técnica: luzes posicionadas estrategicamente para iluminar e valorizar o formato do rosto.\n- Base: tom natural da cliente.\n- Mechas: 8.3/9.0 ou 7.3 + 8.0, posicionadas nas laterais do rosto e no topo.\n- Efeito desejado: iluminar o rosto, criar dimensão e valorizar o formato facial.\n- Subtom: quente/dourado ou neutro, conforme referência.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'balayage-loira', cat: 'coloracao', corte: 'Balayage', title: 'Luzes Naturais',
    desc: 'Mechas pintadas à mão que criam efeito "beijado pelo sol" com crescimento discreto. Ex.: base 6.0/7.0 + mechas 8.3/9.3 + gloss 9.0. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/736x/67/53/d4/6753d4546e18a5b6e121879b4e45a5f5.jpg',
    variants: [
      'https://i.pinimg.com/736x/67/53/d4/6753d4546e18a5b6e121879b4e45a5f5.jpg',
      'https://i.pinimg.com/1200x/9c/38/2e/9c382e31a4eaafd69ce5d685d82f238b.jpg',
      'https://i.pinimg.com/1200x/85/03/4b/85034b9e76143badec90e47cdac4ae36.jpg',
      'https://i.pinimg.com/1200x/bf/f2/4b/bff24b95458ec3242c742d7c7014996b.jpg',
      'https://i.pinimg.com/736x/b2/70/53/b27053d5918d3a819f9e48f0b864cb56.jpg',
      'https://i.pinimg.com/736x/69/81/cb/6981cbf1d971c00a4a4268120a2199be.jpg',
      'https://i.pinimg.com/1200x/a6/2c/4e/a62c4e52baecfd4e5a0cb7203b7c6dd9.jpg',
      'https://i.pinimg.com/736x/92/b3/fa/92b3fad62db6657d1d34725075a9cc0d.jpg',
      'https://i.pinimg.com/1200x/71/91/a0/7191a072c196f845426a91c111b5757b.jpg',
      'https://i.pinimg.com/736x/4f/4c/c3/4f4cc384ba311066a815ec3ba62db5af.jpg'
    ],
    prompt: 'Coloração Balayage aplicada respeitando a referência:\n- Técnica: balayage pintado à mão, com transição suave da raiz às pontas.\n- Base: tom 6.0/7.0 (castanho claro natural).\n- Mechas: 8.3/9.3 (loiro dourado) distribuídas em V, mais claras nas pontas.\n- Gloss final: 9.0 para selar e dar brilho espelhado.\n- Efeito desejado: cabelo "beijado pelo sol", com profundidade e dimensão.\n- Raiz: mantém tom natural escuro (esfumado), sem marcação dura.\n- Subtom: quente/dourado, com reflexos neutros.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial ou postiça.'
  },
  {
    id: 'californianas', cat: 'coloracao', corte: 'California', title: 'Efeito Sol',
    desc: 'Luzes que reproduzem o efeito do sol californiano com transição natural. Ex.: base 5.0/6.0 + pontas 8.3/9.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/c7/92/25/c7922574476f525938331938daf277f7.jpg',
    variants: [
      'https://i.pinimg.com/736x/c7/92/25/c7922574476f525938331938daf277f7.jpg',
      'https://i.pinimg.com/736x/9b/30/3c/9b303c2040de9482f8391090b7cf8cfa.jpg',
      'https://i.pinimg.com/736x/e5/8c/1a/e58c1a4d7b2f9e6c3a8d5b1f7e4c2a96.jpg',
      'https://i.pinimg.com/736x/99/a0/1b/99a01b1ffd110e8e7fcadf5876a06dc7.jpg',
      'https://i.pinimg.com/1200x/9d/f8/60/9df860fa26577c0589865d7e85eaded1.jpg',
      'https://i.pinimg.com/736x/68/75/32/68753259a972205ad340a4a45186bce7.jpg',
      'https://i.pinimg.com/236x/0a/1e/b2/0a1eb224c389443cbcba956be1b3afc9.jpg',
      'https://i.pinimg.com/736x/67/55/9b/67559bf4b3891156ca4ea79c89f1a538.jpg',
      'https://i.pinimg.com/736x/6f/eb/38/6feb38fbbd82b0f67ed85dc10da2012f.jpg',
      'https://i.pinimg.com/736x/ce/af/83/ceaf83e5c53995750f53dacccb66f162.jpg'
    ],
    prompt: 'Coloração Californianas aplicada respeitando a referência:\n- Técnica: californianas — luzes que reproduzem o efeito do sol californiano.\n- Base: tom 5.0/6.0 (castanho médio).\n- Pontas: 8.3/9.3 (loiro dourado) com transição natural.\n- Efeito desejado: cabelo iluminado como se tivesse pego sol da Califórnia.\n- Subtom: quente/dourado, natural.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'framing-contour', cat: 'coloracao', corte: 'Framing', title: 'Contorno Facial',
    desc: 'Mechas frontais que emolduram o rosto sem contraste forte. Ex.: 8.0/9.0 ou 8.3 + 9.0. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/1200x/05/42/66/05426622b672a5271cdfcd4813595269.jpg',
    variants: [
      'https://i.pinimg.com/1200x/05/42/66/05426622b672a5271cdfcd4813595269.jpg',
      'https://i.pinimg.com/1200x/ba/ea/88/baea88db56d4ee70ac25ef7ebe6b4bfa.jpg',
      'https://i.pinimg.com/1200x/7e/3b/92/7e3b92a4f1c5e8d6b3a7c2f9e1d4b86a.jpg',
      'https://i.pinimg.com/1200x/2a/6d/e8/2a6de8b2b6a20546d876e41872a8120d.jpg',
      'https://i.pinimg.com/1200x/79/59/76/795976cd1ec7cfce7cd0baff0cc0e8d5.jpg',
      'https://i.pinimg.com/736x/9f/4c/1e/9f4c1e7a3b8d2f5c6a1e9d4b7f3c2a58.jpg',
      'https://i.pinimg.com/736x/2b/6f/8d/2b6f8d4a9c1e5b7f3a6d2c8e5b1f4a93.jpg',
      'https://i.pinimg.com/736x/6f/04/f7/6f04f7f22120c572e80a8d903f0f2baf.jpg',
      'https://i.pinimg.com/736x/72/3a/68/723a6849cd6b74d8aa9b1282cfceb7c9.jpg'
    ],
    prompt: 'Coloração Framing Contour aplicada respeitando a referência:\n- Técnica: mechas frontais que emolduram o rosto (framing).\n- Tom das mechas: 8.0/9.0 ou 8.3 + 9.0, sem contraste forte.\n- Efeito desejado: iluminar o rosto de forma sutil, emoldurando.\n- Base: mantém tom natural da cliente.\n- Subtom: quente/dourado ou neutro.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'highlights-loira', cat: 'coloracao', corte: 'Highlights', title: 'Luzes Loiras',
    desc: 'Luzes suaves que adicionam dimensão e brilho ao loiro. Ex.: 8.1/9.1 (acinzentado) ou 8.3/9.3 (dourado). Pele fria, neutra e quente.',
    img: 'https://i.pinimg.com/1200x/6f/04/f7/6f04f7f22120c572e80a8d903f0f2baf.jpg',
    variants: [
      'https://i.pinimg.com/1200x/6f/04/f7/6f04f7f22120c572e80a8d903f0f2baf.jpg',
      'https://i.pinimg.com/736x/be/54/1b/be541bc6bb2d9f143c119d52059c66cf.jpg',
      'https://i.pinimg.com/736x/1c/47/4d/1c474dc342e307953abf1eccd45328b1.jpg',
      'https://i.pinimg.com/736x/25/41/59/2541596666a5f2094ff755f0bf14d08d.jpg',
      'https://i.pinimg.com/1200x/b7/9a/bd/b79abd9da6b665d43b474d3844e72d07.jpg',
      'https://i.pinimg.com/1200x/60/15/22/601522009cf3871b56174b99341f5a08.jpg',
      'https://i.pinimg.com/736x/3d/11/34/3d11348cc83f29fbc5fb10873f8d104e.jpg',
      'https://i.pinimg.com/1200x/6a/2d/8e/6a2d8e4b9f1c5a7d3e6b8c2f4a1d5e73.jpg',
      'https://i.pinimg.com/736x/35/a4/d1/35a4d1f4457d1905d4d3b9d868bbf799.jpg',
      'https://i.pinimg.com/736x/c5/2b/92/c52b9243137efa0fce9887e9b4511028.jpg'
    ],
    prompt: 'Coloração Highlights Loiros aplicada respeitando a referência:\n- Técnica: luzes suaves que adicionam dimensão e brilho.\n- Tom: 8.1/9.1 (acinzentado) ou 8.3/9.3 (dourado), conforme referência.\n- Efeito desejado: loiro com dimensão e brilho.\n- Base: tom natural da cliente.\n- Subtom: conforme referência (frio, neutro ou quente).\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'cherry-cola', cat: 'coloracao', corte: 'Cherry', title: 'Vermelho Cereja',
    desc: 'Vermelho profundo com nuances de cereja e cola, vibrante e marcante. Ex.: 4.6/5.6 ou 5.62 + 6.45. Pele fria e neutra.',
    img: 'https://i.pinimg.com/736x/72/3a/68/723a6849cd6b74d8aa9b1282cfceb7c9.jpg',
    variants: [
      'https://i.pinimg.com/736x/d8/23/26/d823267f6084eb8dbea4746f9e460be2.jpg',
      'https://i.pinimg.com/736x/90/60/51/906051584632065dce1b7fca1ece5763.jpg',
      'https://i.pinimg.com/736x/42/23/86/422386d026423c26b09624fc191d1a43.jpg',
      'https://i.pinimg.com/736x/ca/dd/74/cadd749ab1eb1eb434ad2c417c93fa12.jpg',
      'https://i.pinimg.com/736x/cb/57/8f/cb578f4ee3dad6b6f4f3714c7952eecf.jpg',
      'https://i.pinimg.com/1200x/e4/ae/db/e4aedb6d2ff17f4f37c5e6654320c9d3.jpg',
      'https://i.pinimg.com/736x/51/40/ab/5140ab3fd997617fb2595e442c7a224e.jpg',
      'https://i.pinimg.com/736x/e0/21/59/e0215937161205cc83f21d465a5cf4b0.jpg',
      'https://i.pinimg.com/1200x/a4/a1/00/a4a100b913c4ab16ae79a9b79a6c05c8.jpg',
      'https://i.pinimg.com/736x/f2/09/5b/f2095b75d4f28a90b51e0b954094eab5.jpg'
    ],
    prompt: 'Coloração Cherry Cola aplicada respeitando a referência:\n- Técnica: coloração global em vermelho profundo com nuances de cereja e cola.\n- Tom: 4.6/5.6 ou 5.62 + 6.45, conforme referência.\n- Profundidade: vermelho intenso, vibrante e marcante.\n- Subtom: frio/neutro, com reflexos de cereja.\n- Efeito desejado: vermelho profundo e sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'cowgirl-copper', cat: 'coloracao', corte: 'Copper', title: 'Cobre Western',
    desc: 'Cobre intenso e vibrante com atitude moderna e inspiração western. Ex.: 6.4/7.4 ou 7.43 + 6.45. Pele quente e oliva.',
    img: 'https://i.pinimg.com/1200x/7a/d4/f4/7ad4f49a2f9604293e2bc16d65a6d30f.jpg',
    variants: [
      'https://i.pinimg.com/1200x/7a/d4/f4/7ad4f49a2f9604293e2bc16d65a6d30f.jpg',
      'https://i.pinimg.com/736x/39/11/3b/39113b115f5d033e0bd7a1e57a5edb74.jpg',
      'https://i.pinimg.com/736x/9c/aa/f0/9caaf070bac7c0b853e549a47cc288b5.jpg',
      'https://i.pinimg.com/736x/90/2f/8d/902f8dda8998aabe79bbb1efa6a96cfa.jpg',
      'https://i.pinimg.com/1200x/96/d2/e0/96d2e00dd6756da11140d8eb10327ae5.jpg',
      'https://i.pinimg.com/1200x/61/53/9d/61539dda3ba5eb0844362b440f7904e3.jpg',
      'https://i.pinimg.com/736x/7f/2f/16/7f2f16fe8a47abab83bc2d05914a73d2.jpg',
      'https://i.pinimg.com/736x/8d/4f/2b/8d4f2b7a1c5e9d3f6b8a2c4e7d1f5b39.jpg',
      'https://i.pinimg.com/736x/01/f6/b8/01f6b8f1aa7b90c91f5262f11d01d552.jpg',
      'https://i.pinimg.com/736x/c0/f0/cd/c0f0cd5ace640f47763a8f7712796ef1.jpg'
    ],
    prompt: 'Coloração Cowgirl Copper aplicada respeitando a referência:\n- Técnica: coloração global em cobre intenso e vibrante.\n- Tom: 6.4/7.4 ou 7.43 + 6.45, conforme referência.\n- Profundidade: cobre intenso com atitude moderna e inspiração western.\n- Subtom: quente/oliva, com reflexos de cobre.\n- Efeito desejado: cobre vibrante e marcante.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'ruivo-doce-leite', cat: 'coloracao', corte: 'Doce Leite', title: 'Ruivo Caramelo',
    desc: 'Ruivo suave com nuances carameladas, sofisticado e luminoso. Ex.: 7.4/8.34 ou 7.43 + 8.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/8a/7c/d4/8a7cd4c0523d1384c8ac71d6b97b1541.jpg',
    variants: [
      'https://i.pinimg.com/736x/8a/7c/d4/8a7cd4c0523d1384c8ac71d6b97b1541.jpg',
      'https://i.pinimg.com/736x/25/ed/9d/25ed9dab8e2bb53ac9a17b4085e16ab2.jpg',
      'https://i.pinimg.com/736x/a0/b7/97/a0b79786127d2d317058cfff431c0e8e.jpg',
      'https://i.pinimg.com/736x/ef/d6/14/efd614f3111a48956b8731dab0d18169.jpg',
      'https://i.pinimg.com/736x/44/d1/a2/44d1a2eb76969eaaa4a5ac30a8bed2ac.jpg',
      'https://i.pinimg.com/1200x/64/a5/10/64a510801be33070b4d1a6480c5a3ca7.jpg',
      'https://i.pinimg.com/736x/92/06/03/9206038d8d76ffb5d3a52fe2a1787aca.jpg',
      'https://i.pinimg.com/1200x/62/8d/13/628d137b66de5eeea50c8f46c07eeab6.jpg',
      'https://i.pinimg.com/736x/4b/8e/2c/4b8e2c6a9d1f5b7e3c8a2d4f6b1e9c73.jpg',
      'https://i.pinimg.com/736x/35/14/e7/3514e79edee91c65c433bcaa322d2500.jpg'
    ],
    prompt: 'Coloração Ruivo Doce Leite aplicada respeitando a referência:\n- Técnica: coloração em ruivo suave com nuances carameladas.\n- Tom: 7.4/8.34 ou 7.43 + 8.3, conforme referência.\n- Profundidade: ruivo suave, sofisticado e luminoso.\n- Subtom: quente/neutro, com reflexos caramelados.\n- Efeito desejado: ruivo luminoso e sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'grisalhos-frios', cat: 'coloracao', corte: 'Silver', title: 'Cinza Prateado',
    desc: 'Cinza prateado sofisticado que neutraliza tons quentes indesejados. Ex.: 7.1/8.1 ou 8.11 + 9.1. Pele fria e neutra.',
    img: 'https://i.pinimg.com/1200x/0f/8b/f7/0f8bf776c83fa00d99150792aac564fd.jpg',
    variants: [
      'https://i.pinimg.com/1200x/50/4e/3e/504e3eb7e864269f264fab931c66029d.jpg',
      'https://i.pinimg.com/1200x/9f/b2/70/9fb270e7b385a9fc5ce8c3b449c8e125.jpg',
      'https://i.pinimg.com/1200x/90/22/62/9022623353025ec025251d0fca6ae41a.jpg',
      'https://i.pinimg.com/1200x/86/e9/87/86e987efda0248a60149c561cb47ec1d.jpg',
      'https://i.pinimg.com/1200x/ba/a4/80/baa480a80f64dfa597894d29a2c63d8a.jpg',
      'https://i.pinimg.com/1200x/ee/d2/f0/eed2f0d89a9d79860a74a53219b7208e.jpg',
      'https://i.pinimg.com/736x/6d/6f/47/6d6f4795dff5a4328a9665ccdf948cea.jpg',
      'https://i.pinimg.com/736x/8b/c4/cf/8bc4cf25a5cefd0d876ebf26ab8ff437.jpg',
      'https://i.pinimg.com/1200x/e0/6c/98/e06c98514f281f052efb213b8ad4e994.jpg',
      'https://i.pinimg.com/736x/34/dd/25/34dd2553acc5f670fa634dac1fbc6948.jpg'
    ],
    prompt: 'Coloração Grisalhos Frios (Silver) aplicada respeitando a referência:\n- Técnica: coloração em cinza prateado sofisticado.\n- Tom: 7.1/8.1 ou 8.11 + 9.1, conforme referência.\n- Profundidade: cinza prateado que neutraliza tons quentes indesejados.\n- Subtom: frio/neutro, com reflexos prateados.\n- Efeito desejado: cinza prateado sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'grisalhos-quentes', cat: 'coloracao', corte: 'Ash Gold', title: 'Cinza Avermelhado',
    desc: 'Cinza com nuances quentes e acinzentadas, transição natural e moderna. Ex.: 7.13/8.13 ou 8.3 + 8.1. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/1e/aa/75/1eaa7549f9babe98cf52aee19771aa68.jpg',
    variants: [
      'https://i.pinimg.com/736x/1e/aa/75/1eaa7549f9babe98cf52aee19771aa68.jpg',
      'https://i.pinimg.com/1200x/41/63/44/41634453f9941572a5af4e64a9c74792.jpg',
      'https://i.pinimg.com/1200x/4c/40/15/4c401595bc0d22513d8815de3769e552.jpg',
      'https://i.pinimg.com/736x/2b/4f/f3/2b4ff3062a00017b02e6d4036055bbb1.jpg',
      'https://i.pinimg.com/736x/b1/c0/d1/b1c0d1d8acbfe44d122616037e8791a2.jpg',
      'https://i.pinimg.com/1200x/3d/d9/33/3dd933def0a87a05ca2a4730c199200f.jpg',
      'https://i.pinimg.com/736x/28/c5/81/28c581dbf7f0aed7e3e8889878933259.jpg',
      'https://i.pinimg.com/1200x/d7/78/d3/d778d362ee47fa806a65b8313d384acb.jpg',
      'https://i.pinimg.com/1200x/ea/8d/fc/ea8dfc3a7df1272ab467602d5d9b1103.jpg',
      'https://i.pinimg.com/1200x/96/c8/41/96c841cc2444b3b648ba1d25f2ba5742.jpg'
    ],
    prompt: 'Coloração Grisalhos Quentes (Ash Gold) aplicada respeitando a referência:\n- Técnica: coloração em cinza com nuances quentes e acinzentadas.\n- Tom: 7.13/8.13 ou 8.3 + 8.1, conforme referência.\n- Profundidade: cinza com nuances quentes, transição natural e moderna.\n- Subtom: quente/neutro, com reflexos avermelhados.\n- Efeito desejado: cinza quente, moderno.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'mocha-mousse', cat: 'coloracao', corte: 'Mocha', title: 'Marrom Café',
    desc: 'Marrom intenso com nuances suaves que lembram café com leite. Ex.: 5.0/6.0 ou 6.7 + 5.3. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/1200x/2b/aa/ea/2baaea4f4dc0674819552e1a00063c01.jpg',
    variants: [
      'https://i.pinimg.com/1200x/8c/4e/2a/8c4e2a7d1b5f9e3c6a8d4b2f7e1c5a93.jpg',
      'https://i.pinimg.com/1200x/d3/2d/74/d32d74825bfa044d8bb2251ccc5357a4.jpg',
      'https://i.pinimg.com/1200x/e9/c4/f9/e9c4f9b7f739f33ef4841e5e28aaed25.jpg',
      'https://i.pinimg.com/1200x/95/31/cf/9531cfe923ccfc3b4ec2bb62483a9a8c.jpg',
      'https://i.pinimg.com/1200x/34/62/e0/3462e0f503447a59bf41c070ca5d5444.jpg',
      'https://i.pinimg.com/736x/a5/ff/51/a5ff5141709b98ed5ce4b5d1c9ae0bd0.jpg',
      'https://i.pinimg.com/736x/2d/3e/a1/2d3ea1d0d754f7682d492a54f2f50531.jpg',
      'https://i.pinimg.com/736x/ee/44/b9/ee44b9e37f5ddb9c097d777ee5f14e45.jpg',
      'https://i.pinimg.com/1200x/67/11/fb/6711fba091577ed47ccefa55989e16b9.jpg',
      'https://i.pinimg.com/1200x/6e/d4/f1/6ed4f1cd71a34cc7c9964ac0f6cd24ea.jpg'
    ],
    prompt: 'Coloração Mocha Mousse aplicada respeitando a referência:\n- Técnica: coloração em marrom intenso com nuances suaves.\n- Tom: 5.0/6.0 ou 6.7 + 5.3, conforme referência.\n- Profundidade: marrom intenso que lembra café com leite.\n- Subtom: quente/neutro/oliva, com reflexos suaves.\n- Efeito desejado: marrom café sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'expensive-brunette', cat: 'coloracao', corte: 'Brunette', title: 'Morena Premium',
    desc: 'Morena com reflexos estratégicos que criam visual caro e sofisticado. Ex.: base 4.0/5.0 + reflexos 6.3/7.3. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/736x/5e/8a/1c/5e8a1c4d7b2f9e6a3c8d5b1f7e4c2a91.jpg',
    variants: [
      'https://i.pinimg.com/1200x/3e/b2/3d/3eb23d9fc16593ff95825fe42012d267.jpg',
      'https://i.pinimg.com/736x/8f/6b/78/8f6b789b5615427c79df5610a0049d89.jpg',
      'https://i.pinimg.com/1200x/be/c8/00/bec8003024f2f36eac5a7bbf2aa8eba1.jpg',
      'https://i.pinimg.com/736x/9e/61/5e/9e615e0f0ea8a9c610df0d0e4873694f.jpg',
      'https://i.pinimg.com/736x/b1/e0/71/b1e071fe7054b435341a25f422635d6f.jpg',
      'https://i.pinimg.com/736x/e9/2a/ba/e92abaeee99bbc8cfd8fe2820ccd5a57.jpg',
      'https://i.pinimg.com/1200x/a9/1d/0e/a91d0e7df9dd09eca66a0ef976d70c5b.jpg',
      'https://i.pinimg.com/736x/08/02/64/080264d0c040d46b1481762780120b95.jpg',
      'https://i.pinimg.com/736x/37/b6/c9/37b6c9c11eba90179150f789c458d5e3.jpg',
      'https://i.pinimg.com/1200x/2f/6b/9d/2f6b9d4c1a7e5b3f8a2c6d9e1f4b7a53.jpg'
    ],
    prompt: 'Coloração Expensive Brunette (morena premium) aplicada respeitando a referência:\n- Técnica: coloração em morena com reflexos estratégicos.\n- Base: 4.0/5.0.\n- Reflexos: 6.3/7.3, posicionados para criar dimensão.\n- Profundidade: morena com visual caro e sofisticado.\n- Subtom: quente/neutro/oliva.\n- Efeito desejado: morena premium, sofisticada.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'vanilla-blonde', cat: 'coloracao', corte: 'Vanilla', title: 'Loira Baunilha',
    desc: 'Loira suave e cremosa com tons de baunilha e caramelo. Ex.: 9.7/9.3 ou mistura 8.3 + 9.0 (10 vol). Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/0f/d3/d1/0fd3d1b4918ed11c72d2fca3e8c8a8a7.jpg',
    variants: [
      'https://i.pinimg.com/736x/36/2e/76/362e768aeb7ed3f16afb82c85bf8bb7e.jpg',
      'https://i.pinimg.com/736x/e8/31/c4/e831c4a68d507a47952ab3ab3349209f.jpg',
      'https://i.pinimg.com/736x/b7/15/82/b71582e483db5ee57b2dee5002605dd5.jpg',
      'https://i.pinimg.com/736x/9c/4e/2a/9c4e2a6d1b8f5e3c7a9d4b2f6e1c5a83.jpg',
      'https://i.pinimg.com/736x/35/db/af/35dbafa03c10942692ed5e38f9131229.jpg',
      'https://i.pinimg.com/736x/00/42/c9/0042c9ecd8f745f76c58d1b85f9ed36e.jpg',
      'https://i.pinimg.com/1200x/99/2d/e5/992de584e0b0e2749797baf37280f536.jpg',
      'https://i.pinimg.com/1200x/5f/ce/53/5fce536489e8c7241f02770ebb3634b4.jpg',
      'https://i.pinimg.com/736x/81/4c/4d/814c4d34d64919cea3bdfd878c5250e5.jpg',
      'https://i.pinimg.com/1200x/27/dc/08/27dc0830061a5ab30fb7e4fa82b6b5a3.jpg'
    ],
    prompt: 'Coloração Vanilla Blonde (loira baunilha) aplicada respeitando a referência:\n- Técnica: coloração em loiro suave e cremoso.\n- Tom: 9.7/9.3 ou mistura 8.3 + 9.0 (10 vol), conforme referência.\n- Profundidade: loiro suave com tons de baunilha e caramelo.\n- Subtom: quente/neutro, com reflexos cremosos.\n- Efeito desejado: loiro baunilha suave e cremoso.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'blond-de-provence', cat: 'coloracao', corte: 'Provence', title: 'Loiro Dourado Provençal',
    desc: 'Loiro dourado com nuances quentes inspirado na luz da Provença. Ex.: base 7.0/8.0 + mechas 9.3/10.3 + gloss 9.0. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/5a/74/d5/5a74d546fc0b084124a730c7307d57c0.jpg',
    variants: [
      'https://i.pinimg.com/1200x/8b/3e/2a/8b3e2a7d1f5c9e4b6a8d2c5f7e1b4a93.jpg',
      'https://i.pinimg.com/736x/1a/4f/8c/1a4f8c3e7b2d9a5f6c1e8b4d2a7f3c95.jpg',
      'https://i.pinimg.com/736x/d6/bf/d1/d6bfd17338aebccece8b27920eb062d4.jpg',
      'https://i.pinimg.com/1200x/23/e0/58/23e0584959e272e356bd429280fe1c48.jpg',
      'https://i.pinimg.com/1200x/2a/52/a5/2a52a5b54527deebdb8382b12e7e243a.jpg',
      'https://i.pinimg.com/736x/be/50/d5/be50d515a1d8487a39e9f8e5328a92e7.jpg',
      'https://i.pinimg.com/736x/e9/a1/b6/e9a1b63fd1b5cfc6b03979a9673ef7aa.jpg',
      'https://i.pinimg.com/736x/2f/89/fc/2f89fc2679984437e027bb8058c2d7f3.jpg',
      'https://i.pinimg.com/1200x/57/31/b5/5731b56a9361a4b27be2645e83f4677c.jpg',
      'https://i.pinimg.com/736x/b7/15/82/b71582e483db5ee57b2dee5002605dd5.jpg'
    ],
    prompt: 'Coloração Blond de Provence (loiro dourado provençal) aplicada respeitando a referência:\n- Técnica: coloração em loiro dourado com nuances quentes.\n- Base: 7.0/8.0.\n- Mechas: 9.3/10.3.\n- Gloss: 9.0.\n- Profundidade: loiro dourado com nuances quentes inspirado na luz da Provença.\n- Subtom: quente/neutro, com reflexos dourados.\n- Efeito desejado: loiro dourado provençal.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'castanho-veneza', cat: 'coloracao', corte: 'Venice', title: 'Castanho Profundo com Reflexos Quentes',
    desc: 'Castanho profundo com reflexos quentes inspirado na tradição veneziana. Ex.: base 4.0/5.0 + reflexos 5.3/6.3. Pele quente e oliva.',
    img: 'https://i.pinimg.com/1200x/d6/03/48/d6034885db6c8ed5ec5d84f05db7033c.jpg',
    variants: [
      'https://i.pinimg.com/1200x/3c/f5/34/3cf53462c0d6e87f978248ebe70f3fe6.jpg',
      'https://i.pinimg.com/1200x/4f/40/02/4f4002c4d5a249913c4e88a6739d1d55.jpg',
      'https://i.pinimg.com/1200x/30/02/94/300294ca9997d7c729a54f29124b3c30.jpg',
      'https://i.pinimg.com/1200x/05/5f/7b/055f7b790631c43cf0bf940dcf7036d6.jpg',
      'https://i.pinimg.com/1200x/75/06/aa/7506aa8b638a36cf60f1eea3cc0baf01.jpg',
      'https://i.pinimg.com/1200x/6d/8e/2c/6d8e2c7a4b9f1e5d3a6c8b2f7e4a1d95.jpg',
      'https://i.pinimg.com/1200x/4b/7f/1d/4b7f1d9e6a3c8b5f2d7e4a1c6f9b3d72.jpg',
      'https://i.pinimg.com/1200x/8f/ff/12/8fff129903ffcc7194c50e7aa30f9fed.jpg',
      'https://i.pinimg.com/736x/3b/9e/64/3b9e64e1cc395fc4d2c7865026532c61.jpg',
      'https://i.pinimg.com/736x/9e/2a/5c/9e2a5c8d1b7f4e3a6d9c2b5f8a1e4d73.jpg'
    ],
    prompt: 'Coloração Castanho Veneza aplicada respeitando a referência:\n- Técnica: coloração em castanho profundo com reflexos quentes.\n- Base: 4.0/5.0.\n- Reflexos: 5.3/6.3.\n- Profundidade: castanho profundo com reflexos quentes inspirado na tradição veneziana.\n- Subtom: quente/oliva.\n- Efeito desejado: castanho profundo com reflexos quentes.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'morena-iluminada-carioca', cat: 'coloracao', corte: 'Carioca', title: 'Castanho com Mechas Tropicais',
    desc: 'Castanho com mechas que capturam a luz do sol carioca, vibrante e natural. Ex.: base 5.0/6.0 + mechas 8.3/9.3 + babylights 7.3. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/1200x/e8/cc/fd/e8ccfd0d23c0a67cdec7b3518588c87a.jpg',
    variants: [
      'https://i.pinimg.com/1200x/46/9d/b3/469db33b0463950876ea5d975da0e566.jpg',
      'https://i.pinimg.com/736x/a3/4f/21/a34f2174f0d2482713d493ed5b60dcb1.jpg',
      'https://i.pinimg.com/736x/fd/e0/da/fde0da86fc5da14fec4f27dc72bbe12a.jpg',
      'https://i.pinimg.com/1200x/b1/9b/b2/b19bb26b3d54810549976ecd9970adc4.jpg',
      'https://i.pinimg.com/736x/88/0e/ae/880eae766ddf0e83527343e5ca4b7b41.jpg',
      'https://i.pinimg.com/1200x/1a/e0/dd/1ae0ddbec42dc22ef8ef25524f799de5.jpg',
      'https://i.pinimg.com/736x/3a/15/8c/3a158c4e8fe184921a993b782c4f63b8.jpg',
      'https://i.pinimg.com/1200x/f9/3e/92/f93e920afa190e3376f9591b7dce8877.jpg',
      'https://i.pinimg.com/736x/42/1f/3a/421f3a148a6a37513c9fa04c5ed3b1dc.jpg',
      'https://i.pinimg.com/736x/52/21/f8/5221f8901b131e40fa5a6f5ae7d0e8ea.jpg'
    ],
    prompt: 'Coloração Morena Iluminada Carioca aplicada respeitando a referência:\n- Técnica: coloração em castanho com mechas que capturam a luz do sol carioca.\n- Base: 5.0/6.0.\n- Mechas: 8.3/9.3.\n- Babylights: 7.3.\n- Profundidade: castanho com mechas vibrantes e naturais.\n- Subtom: quente/neutro/oliva.\n- Efeito desejado: morena iluminada, vibrante e natural.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'brunette-romantique', cat: 'coloracao', corte: 'Romantique', title: 'Castanho com Nuances Suaves',
    desc: 'Castanho com nuances suaves e românticas inspirado no estilo francês. Ex.: base 5.0/6.0 + reflexos 6.7/7.7 ou 6.3/7.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/1200x/48/ee/44/48ee440c6712e07c385f64752e866ae9.jpg',
    variants: [
      'https://i.pinimg.com/1200x/5e/2b/f0/5e2bf098d9eca6e2b22a34e19fda4ae9.jpg',
      'https://i.pinimg.com/736x/0a/5e/12/0a5e12f20ca2415b8fddbd1f5583b391.jpg',
      'https://i.pinimg.com/736x/9a/6e/27/9a6e279af8b3895e161b38107d50ab8e.jpg',
      'https://i.pinimg.com/736x/c9/3f/9d/c93f9d9610909597859d5aefda31f151.jpg',
      'https://i.pinimg.com/736x/ad/a1/46/ada146678d7950cc55fe4ad4f01cbd15.jpg',
      'https://i.pinimg.com/1200x/57/b9/90/57b99020f9f86cd96d54316f31db2103.jpg',
      'https://i.pinimg.com/1200x/61/6d/45/616d45b91da4964e7e022f58d7a0eb44.jpg',
      'https://i.pinimg.com/1200x/b7/8a/b6/b78ab6932e183d7e89fbe62ede38fec6.jpg',
      'https://i.pinimg.com/736x/c3/7c/04/c37c04c8558653e9e0168e13f1a8e1f8.jpg',
      'https://i.pinimg.com/1200x/0b/15/fa/0b15fa533f2633f86402eb94a9a399d7.jpg'
    ],
    prompt: 'Coloração Brunette Romantique aplicada respeitando a referência:\n- Técnica: coloração em castanho com nuances suaves e românticas.\n- Base: 5.0/6.0.\n- Reflexos: 6.7/7.7 ou 6.3/7.3.\n- Profundidade: castanho com nuances suaves inspirado no estilo francês.\n- Subtom: quente/neutro.\n- Efeito desejado: castanho romântico e sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'rosso-romano', cat: 'coloracao', corte: 'Romano', title: 'Ruivo Intenso',
    desc: 'Ruivo intenso com alma romana, vibrante e cheio de personalidade. Ex.: 5.6/6.6 ou 6.45 + 5.62. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/736x/0d/d4/74/0dd474599a2c97cc033d4b286d328fd2.jpg',
    variants: [
      'https://i.pinimg.com/1200x/3f/75/5d/3f755dd2ec59ecb93a8ac5c7291ab6f3.jpg',
      'https://i.pinimg.com/1200x/e1/d2/e3/e1d2e36c54a43e474203e56775aa20a0.jpg',
      'https://i.pinimg.com/1200x/6f/07/ba/6f07ba70513bad2e3c3135c2ae8b93cc.jpg',
      'https://i.pinimg.com/736x/bb/fd/9a/bbfd9afc2f271f460e5df2cc191d9fc5.jpg',
      'https://i.pinimg.com/736x/86/0e/ad/860eadf20054a131cd5b86ad32ad748b.jpg',
      'https://i.pinimg.com/1200x/0f/59/78/0f59782ab7878db0205a4950b0baac05.jpg',
      'https://i.pinimg.com/736x/e8/54/44/e85444adb13ee125ac8e115e5107e379.jpg',
      'https://i.pinimg.com/1200x/c9/34/8c/c9348c0e3ae914e596c52a8ba5977f8f.jpg',
      'https://i.pinimg.com/736x/b3/cc/22/b3cc2294403e9110b15f21ab51480cb0.jpg',
      'https://i.pinimg.com/1200x/fe/82/eb/fe82ebac89f09eecaaa255ed2b426376.jpg'
    ],
    prompt: 'Coloração Rosso Romano (ruivo intenso) aplicada respeitando a referência:\n- Técnica: coloração em ruivo intenso.\n- Tom: 5.6/6.6 ou 6.45 + 5.62.\n- Profundidade: ruivo intenso com alma romana, vibrante e cheio de personalidade.\n- Subtom: quente/neutro/oliva.\n- Efeito desejado: ruivo intenso e vibrante.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'glazed-pecan-brunette', cat: 'coloracao', corte: 'Pecan', title: 'Castanho Envernizado',
    desc: 'Balayage suave com gloss que cria profundidade e brilho espelhado. Ex.: base 5.0/6.0 + nozes 6.34/7.34 + toque de cobre. Pele quente e neutra.',
    img: 'https://i.pinimg.com/1200x/57/fe/9c/57fe9cf6cff376f087dd74e3edb101c1.jpg',
    variants: [
      'https://i.pinimg.com/1200x/1a/e0/dd/1ae0ddbec42dc22ef8ef25524f799de5.jpg',
      'https://i.pinimg.com/1200x/f5/7b/52/f57b5260a1e5e8c538fbf6257123dc07.jpg',
      'https://i.pinimg.com/1200x/65/0a/d7/650ad79e03ff294a0197831ee029e6c0.jpg',
      'https://i.pinimg.com/736x/0f/42/56/0f4256eee4951db822d1fb9cab17a8e4.jpg',
      'https://i.pinimg.com/736x/b3/66/02/b36602c1f1a734499ffd0fc33a0b7bc4.jpg',
      'https://i.pinimg.com/736x/27/c3/a2/27c3a2ad4821cc2662e394ce397724f8.jpg',
      'https://i.pinimg.com/736x/6f/eb/38/6feb38fbbd82b0f67ed85dc10da2012f.jpg',
      'https://i.pinimg.com/736x/ee/64/4b/ee644bb55e9363fec9e4398adbad8111.jpg',
      'https://i.pinimg.com/736x/59/b3/c2/59b3c2e6ed947d43216cf3ff87b495c3.jpg',
      'https://i.pinimg.com/736x/df/60/2c/df602c08275cd7e26bcc8ed5cdd45b00.jpg'
    ],
    prompt: 'Coloração Glazed Pecan Brunette aplicada respeitando a referência:\n- Técnica: balayage suave com gloss.\n- Base: 5.0/6.0.\n- Nozes: 6.34/7.34 + toque de cobre.\n- Profundidade: castanho envernizado com profundidade e brilho espelhado.\n- Subtom: quente/neutro.\n- Efeito desejado: castanho envernizado com brilho.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'champagne-brunette', cat: 'coloracao', corte: 'Champagne', title: 'Castanho com Mechas Champagne',
    desc: 'Mechas finas nas pontas com raiz esfumada, transição suave e baixa manutenção. Ex.: base 6.0/7.0 + babylights 8.3/9.0 + gloss bege. Pele quente, neutra e oliva.',
    img: 'https://i.pinimg.com/736x/af/21/17/af21174c369d5f14f8aafec877a9b7d9.jpg',
    variants: [
      'https://i.pinimg.com/1200x/55/50/41/55504151cac940d1233487d7c3920acd.jpg',
      'https://i.pinimg.com/1200x/80/b1/b5/80b1b5100f37b6b552d501592b71f99a.jpg',
      'https://i.pinimg.com/736x/ae/e0/26/aee0265750c51219487afaaaa91b57ca.jpg',
      'https://i.pinimg.com/736x/10/08/e0/1008e0c9e3c5adad76402eb9856ddf43.jpg',
      'https://i.pinimg.com/736x/a6/ed/d2/a6edd2686ee636857385f6193ccd0855.jpg',
      'https://i.pinimg.com/1200x/d4/87/5c/d4875cc4447126e8b72efff7974cc513.jpg',
      'https://i.pinimg.com/736x/17/b0/8c/17b08cf8d6a08bb76314af69193586be.jpg',
      'https://i.pinimg.com/736x/47/28/9f/47289f21bb77a987ad633a3ecde51fd4.jpg',
      'https://i.pinimg.com/736x/78/5b/65/785b65e133701ad58a36332a9f81e266.jpg',
      'https://i.pinimg.com/736x/12/21/8e/12218e23a1f7d51e3b3f357905cbbb78.jpg'
    ],
    prompt: 'Coloração Champagne Brunette aplicada respeitando a referência:\n- Técnica: mechas finas nas pontas com raiz esfumada.\n- Base: 6.0/7.0.\n- Babylights: 8.3/9.0.\n- Gloss: bege.\n- Profundidade: castanho com mechas champagne, transição suave e baixa manutenção.\n- Subtom: quente/neutro/oliva.\n- Efeito desejado: castanho com mechas champagne, suave.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'tuscan-leather', cat: 'coloracao', corte: 'Tuscan', title: 'Castanho Dourado Difuminado',
    desc: 'Color melting com subtom dourado sutil que emerge como couro iluminado pelo sol. Ex.: base 5.0/6.0 + fusão 6.3/7.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/64/5c/7c/645c7c5f1ee4f22856a16fc09bdea910.jpg',
    variants: [
      'https://i.pinimg.com/1200x/f5/2a/5c/f52a5c3e84bb0e1cc1d65034e7ac7847.jpg',
      'https://i.pinimg.com/1200x/7d/fa/65/7dfa653eb75454b36067d36b4c143641.jpg',
      'https://i.pinimg.com/736x/1b/da/ef/1bdaef58cbc703a7d7f3fca88b578893.jpg',
      'https://i.pinimg.com/736x/9e/60/0e/9e600e867b2786efb3effb2bc6fc582b.jpg',
      'https://i.pinimg.com/1200x/1f/f2/ff/1ff2fffc524e87a9a22e840276af33cc.jpg',
      'https://i.pinimg.com/736x/0c/8b/bb/0c8bbbdf1e8283e84d20876a53a17262.jpg',
      'https://i.pinimg.com/736x/8c/2f/fb/8c2ffb69266317402f17c8e2fd120420.jpg',
      'https://i.pinimg.com/1200x/ef/75/32/ef7532b6df5208f0104828de694b3cac.jpg',
      'https://i.pinimg.com/1200x/8e/99/f6/8e99f60240bf7e5b739c06c39ee39967.jpg',
      'https://i.pinimg.com/1200x/33/0c/56/330c56f797858bfb3e702923df2c5823.jpg'
    ],
    prompt: 'Coloração Tuscan Leather (castanho dourado difuminado) aplicada respeitando a referência:\n- Técnica: color melting com subtom dourado sutil.\n- Base: 5.0/6.0.\n- Fusão: 6.3/7.3.\n- Profundidade: castanho com subtom dourado que emerge como couro iluminado pelo sol.\n- Subtom: quente/neutro.\n- Efeito desejado: castanho dourado difuminado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'sun-washed-soft-lights', cat: 'coloracao', corte: 'Soft Lights', title: 'Luzes Suaves Efeito Sol',
    desc: 'Mechas delicadas que simulam o efeito do sol com crescimento natural. Ex.: base 7.0/8.0 + soft-lights 9.3/10.3. Pele quente e neutra.',
    img: 'https://i.pinimg.com/736x/93/13/df/9313df11a33eece966f8afc89f695ab7.jpg',
    variants: [
      'https://i.pinimg.com/1200x/3a/da/25/3ada25769a100612bf1341877198b303.jpg',
      'https://i.pinimg.com/736x/e7/c8/f3/e7c8f3c1af250baeccb536e57f7d9f9e.jpg',
      'https://i.pinimg.com/736x/d8/e1/64/d8e1646efa9e79d5217e92560a235634.jpg',
      'https://i.pinimg.com/736x/72/2b/02/722b02a83f4a69830efb975c9d205b3f.jpg',
      'https://i.pinimg.com/1200x/c0/78/e8/c078e852925e2ef9a56799ac34f157d4.jpg',
      'https://i.pinimg.com/736x/62/48/d2/6248d2b314fa3be5abad2624e98af6b9.jpg',
      'https://i.pinimg.com/736x/84/e7/b5/84e7b5e2419a92c0eb22df33c2c99c90.jpg',
      'https://i.pinimg.com/736x/9c/a7/2e/9ca72e40da8c3cae6be133f4e655f06b.jpg',
      'https://i.pinimg.com/1200x/e0/6f/6e/e06f6ed5dd0147d014daaa2f8ac91ae2.jpg',
      'https://i.pinimg.com/736x/4e/8a/2c/4e8a2c7b1d5f9e3a6c8b4d2f7e1a5c93.jpg'
    ],
    prompt: 'Coloração Sun-Washed Soft Lights (luzes suaves efeito sol) aplicada respeitando a referência:\n- Técnica: mechas delicadas que simulam o efeito do sol.\n- Base: 7.0/8.0.\n- Soft-lights: 9.3/10.3.\n- Profundidade: mechas delicadas com crescimento natural.\n- Subtom: quente/neutro.\n- Efeito desejado: luzes suaves com efeito sol.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  },
  {
    id: 'whisky-copper', cat: 'coloracao', corte: 'Whisky', title: 'Cobre Âmbar Sofisticado',
    desc: 'Cobre profundo com tons de âmbar e canela, evolução sofisticada do cobre vibrante. Ex.: base 6.0/7.0 + mechas 7.4/8.4. Pele quente e oliva.',
    img: 'https://i.pinimg.com/736x/72/e1/4b/72e14b8ff3131638b471c9e4c9b67260.jpg',
    variants: [
      'https://i.pinimg.com/1200x/7a/d4/4c/7ad44cd83f9f4a63e7436645d281e77d.jpg',
      'https://i.pinimg.com/1200x/8e/2a/5c/8e2a5c7d1b4f9e3a6c8d2b5f7e1a4c93.jpg',
      'https://i.pinimg.com/1200x/40/16/f1/4016f19a6f157bce7583f6682b322cbe.jpg',
      'https://i.pinimg.com/736x/44/37/a6/4437a686d32bfda68a4e5c068236dbfc.jpg',
      'https://i.pinimg.com/1200x/d8/ff/a1/d8ffa12a64b919f873686afca926e152.jpg',
      'https://i.pinimg.com/736x/90/fe/3e/90fe3eb09983c7df92bcde9d7127ac39.jpg',
      'https://i.pinimg.com/1200x/94/ad/03/94ad03bbd8f7f1d1a344eb0013e812fb.jpg',
      'https://i.pinimg.com/736x/70/7a/a2/707aa2434b70cd60028c0209929ccda3.jpg',
      'https://i.pinimg.com/1200x/7b/c2/1e/7bc21e69997d9f64dbff56c8deb96f2f.jpg',
      'https://i.pinimg.com/736x/f8/8a/04/f88a041d24ca4fbe9ffc8e6493ccad8a.jpg'
    ],
    prompt: 'Coloração Whisky Copper (cobre âmbar sofisticado) aplicada respeitando a referência:\n- Técnica: coloração em cobre profundo com tons de âmbar e canela.\n- Base: 6.0/7.0.\n- Mechas: 7.4/8.4.\n- Profundidade: cobre profundo com tons de âmbar e canela, evolução sofisticada do cobre vibrante.\n- Subtom: quente/oliva.\n- Efeito desejado: cobre âmbar sofisticado.\n- A cor deve integrar-se ao subtom de pele natural da cliente, sem parecer artificial.'
  }
];


// ============================================================
// 7. DADOS: PRODUTOS (15 itens)
// ============================================================
var produtosData = [
  ['kerastase-resistance-shampoo', 'produto', 'Kérastase Resistance Shampoo', 'Força e Reconstrução',
    'Shampoo reconstrutor com Fibra-Kératine que devolve força e elasticidade. Indicado para cabelos danificados e quebradiços. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/1200x/82/3a/72/823a7254a510ec701bcee0e480ba8315.jpg',
    ['https://i.pinimg.com/736x/78/c0/a0/78c0a0db1783a7951c45cf16793df640.jpg',
      'https://i.pinimg.com/1200x/82/3a/72/823a7254a510ec701bcee0e480ba8315.jpg',
      'https://i.pinimg.com/1200x/88/0c/ad/880cadbbbe402961bb3bc96bb3b5ca54.jpg']
  ],
  ['kerastase-resistance-conditioner', 'produto', 'Kérastase Resistance Conditioner', 'Reconstrução Diária',
    'Condicionador reconstrutor que nutre e fortalece a fibra. Indicado para cabelos danificados. Uso diário, após o shampoo.',
    'https://i.pinimg.com/736x/fa/45/3b/fa453bcb817656633d0c07edf6aa8050.jpg',
    ['https://i.pinimg.com/736x/cb/3a/6a/cb3a6a212e772729875a40bf24d531f8.jpg',
      'https://i.pinimg.com/736x/24/0e/b1/240eb125b9e37fe19a69d67fe456df27.jpg',
      'https://i.pinimg.com/736x/ab/d4/6f/abd46fc8a83389a59dd9b55eb16037f9.jpg']
  ],
  ['kerastase-resistance-mask', 'produto', 'Kérastase Resistance Mask', 'Reconstrução Profunda',
    'Máscara de reconstrução intensiva com Fibra-Kératine. Indicada para cabelos danificados por química e calor. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/736x/8d/eb/c3/8debc3b7fb7a7e165e3870776c00c7e6.jpg',
    ['https://i.pinimg.com/1200x/13/c3/75/13c37585028872dc32a4297eee127e6e.jpg',
      'https://i.pinimg.com/736x/a0/2e/cf/a02ecf93acaae6f8bf0aa5d91d0ffa71.jpg',
      'https://i.pinimg.com/736x/3a/64/48/3a6448de3f6a44a84b7cab17c7a11071.jpg']
  ],
  ['kerastase-chronologiste-oil', 'produto', 'Kérastase Chronologiste Oil', 'Óleo Regenerador',
    'Óleo regenerador com tecnologia Quantum que nutre e protege. Indicado para cabelos secos e opacos. Aplicar nas pontas, sem enxaguar.',
    'https://i.pinimg.com/1200x/59/d8/dd/59d8dd9ea4a78fdeb7e0b420ffcdda0a.jpg',
    ['https://i.pinimg.com/736x/59/c0/57/59c0570e163d499dc010ccd33581ce6d.jpg',
      'https://i.pinimg.com/736x/51/d7/7d/51d77d1ba30e0bd6e67cb598001aadbd.jpg',
      'https://i.pinimg.com/736x/e5/63/30/e56330b7327b151f6085b8daa5aa6a8e.jpg']
  ],
  ['kerastase-thermique', 'produto', 'Kérastase Resistance Thermique', 'Protetor Térmico',
    'Protetor térmico que protege até 230°C. Indicado para todos os tipos de cabelo. Aplicar antes da secagem e modelagem.',
    'https://i.pinimg.com/736x/f6/62/3d/f6623df560fe941b4fce33574488031c.jpg',
    ['https://i.pinimg.com/736x/a4/3d/4e/a43d4e01816a1ac5f01f449c1e4ddf5e.jpg',
      'https://i.pinimg.com/736x/b4/8d/97/b48d9783d0ab18919321f36e1386c0bc.jpg',
      'https://i.pinimg.com/1200x/5f/fd/db/5ffddb136e62711a585f1c040fe847ad.jpg']
  ],
  ['joico-moisture-shampoo', 'produto', 'Joico Moisture Shampoo', 'Hidratação Intensa',
    'Shampoo hidratante com Bio-Advanced Peptide Complex. Indicado para cabelos secos e danificados. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/736x/76/24/51/7624516be549ec68f4b74a9d481fe8c2.jpg',
    ['https://i.pinimg.com/736x/aa/91/ef/aa91ef7f58d2efed392dea3444690a5d.jpg',
      'https://i.pinimg.com/1200x/e3/93/4c/e3934c0c465aa33ef0c295d9fb6e5e65.jpg',
      'https://i.pinimg.com/736x/76/24/51/7624516be549ec68f4b74a9d481fe8c2.jpg']
  ],
  ['joico-moisture-conditioner', 'produto', 'Joico Moisture Conditioner', 'Nutrição e Maciez',
    'Condicionador hidratante com maciez e proteção. Indicado para cabelos secos. Uso diário, após o shampoo.',
    'https://i.pinimg.com/1200x/d6/b4/fc/d6b4fc118f3fdfa53cb3a9e842a4da52.jpg',
    ['https://i.pinimg.com/736x/21/23/3f/21233f6f00420dfd920ff5deda8f32f1.jpg',
      'https://i.pinimg.com/736x/ec/b3/8b/ecb38bd4b30677f9ec9b63fb3b274c6e.jpg',
      'https://i.pinimg.com/736x/7b/f8/b2/7bf8b2cb9df40798577467ce0953004f.jpg']
  ],
  ['joico-moisture-mask', 'produto', 'Joico Moisture Mask', 'Hidratação Profunda',
    'Máscara de hidratação intensa com Bio-Advanced Peptide. Indicada para cabelos secos e opacos. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/1200x/6d/38/3b/6d383b8f18eae583c30adb655611d86d.jpg',
    ['https://i.pinimg.com/1200x/45/cc/98/45cc98b8de46cd2c214dde346fd16ed1.jpg',
      'https://i.pinimg.com/736x/2b/b8/31/2bb831c5fd89a70851841665fae8b96b.jpg',
      'https://i.pinimg.com/1200x/ff/d2/b9/ffd2b9808ccc298af28afb560b59c9ad.jpg']
  ],
  ['joico-color-endure', 'produto', 'Joico Color Endure Shampoo', 'Proteção de Cor',
    'Shampoo protetor de cor com Peptide Complex. Indicado para cabelos coloridos. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/1200x/7b/72/ce/7b72ce51623ca5386e74a59598dc9de3.jpg',
    ['https://i.pinimg.com/1200x/0c/26/86/0c26865afb8790fd2e02a2714cb5e683.jpg',
      'https://i.pinimg.com/1200x/c8/01/3f/c8013fa8af539f27af838956ccd3effe.jpg',
      'https://i.pinimg.com/736x/18/6e/5a/186e5aab3bba985de96fe34acca5d2ea.jpg']
  ],
  ['joico-defy-damage', 'produto', 'Joico Defy Damage Shampoo', 'Defesa Antidano',
    'Shampoo protetor com Smart Release que defende de danos diários. Indicado para cabelos fragilizados. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/1200x/47/dd/21/47dd2172feacdaee8088c8119187edf3.jpg',
    ['https://i.pinimg.com/736x/7f/b9/b8/7fb9b8eae64870529b3c85c71e352f42.jpg',
      'https://i.pinimg.com/1200x/22/10/a0/2210a03151a42c9cb2b1623d4feef886.jpg',
      'https://i.pinimg.com/736x/24/35/1d/24351d93b8f043103eac576654cb5344.jpg']
  ],
  ['expert-absolut-repair-shampoo', 'produto', 'Expert Absolut Repair Shampoo', 'Reconstrução',
    'Shampoo reconstrutor com Lipid-Repair. Indicado para cabelos quimicamente danificados. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/1200x/b2/69/d0/b269d04d3de7148082db4c45c179f2e6.jpg',
    ['https://i.pinimg.com/736x/be/1f/d5/be1fd51303ae794b19534394da3a861a.jpg',
      'https://i.pinimg.com/736x/89/6b/1c/896b1c1390819bb687feee9ad8ae7297.jpg',
      'https://i.pinimg.com/736x/82/a2/c8/82a2c82c0b93bf4eebacac702dfb3b6e.jpg']
  ],
  ['expert-absolut-repair-conditioner', 'produto', 'Expert Absolut Repair Conditioner', 'Reconstrução Diária',
    'Condicionador reconstrutor que desembaraça e fortalece. Indicado para cabelos danificados. Uso diário, após o shampoo.',
    'https://i.pinimg.com/1200x/f7/0d/00/f70d00dddda6b8019e9fb55d0d92c63d.jpg',
    ['https://i.pinimg.com/736x/ac/e6/94/ace69459b5f955c0fefd0b873fe43f14.jpg',
      'https://i.pinimg.com/736x/82/5f/da/825fda428e6be4547421a812c0dabdea.jpg',
      'https://i.pinimg.com/736x/f6/2e/e0/f62ee03b99af4d0b7576e2ae45ba7633.jpg']
  ],
  ['expert-absolut-repair-mask', 'produto', 'Expert Absolut Repair Mask', 'Reconstrução Profunda',
    'Máscara reconstrutora com Lipid-Repair. Indicada para cabelos severamente danificados. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/736x/cf/a0/80/cfa0808650dee9524e0165d430e0098e.jpg',
    ['https://i.pinimg.com/736x/34/59/ce/3459cebc3044e956410bb887d8a53457.jpg',
      'https://i.pinimg.com/736x/f7/c2/e3/f7c2e3d49a4f6e4af307529e5cc5932f.jpg',
      'https://i.pinimg.com/736x/6d/55/05/6d55050a72f3a6e613c062c5f1a2a047.jpg']
  ],
  ['expert-vitamino-color', 'produto', 'Expert Vitamino Color Shampoo', 'Proteção de Cor Diária',
    'Shampoo protetor de cor com Neo-Pigment. Indicado para cabelos coloridos. Uso diário, em cabelos úmidos.',
    'https://i.pinimg.com/736x/8c/4a/25/8c4a254ff5b4a4541a900bad2089b9c2.jpg',
    ['https://i.pinimg.com/1200x/3c/6a/9c/3c6a9cbababc27152504ca4953e738ff.jpg',
      'https://i.pinimg.com/736x/c7/df/b2/c7dfb25b28a11dcd98eb8ec001fb95c6.jpg',
      'https://i.pinimg.com/1200x/49/13/db/4913db0aeb90eaa39af627682e595518.jpg']
  ],
  ['expert-metal-detox', 'produto', 'Expert Metal Detox', 'Desintoxicação Capilar',
    'Tratamento pré-coloração que remove partículas metálicas. Indicado para todos os tipos de cabelo antes da química. Aplicar antes da coloração.',
    'https://i.pinimg.com/736x/3d/0f/ec/3d0fece6981e4f8fedac2225a2515c96.jpg',
    ['https://i.pinimg.com/736x/dd/fa/e3/ddfae3b1f8f559f1843aea2610ac3176.jpg',
      'https://i.pinimg.com/1200x/b8/6e/fe/b86efec2e8686d63a0ab7149e0ff6f54.jpg',
      'https://i.pinimg.com/1200x/dd/fd/86/ddfd86b022f90fb7491aea4eb55b76d3.jpg']
  ]
];


// ============================================================
// 8. DADOS: KITS (15 itens)
// ============================================================
var kitsData = [
  ['kit-kerastase-resistance', 'kit', 'Kérastase Resistance Kit', 'Reconstrução Completa',
    'Shampoo + Condicionador + Máscara Resistance. Reconstrução intensiva para cabelos danificados. Uso semanal, em 3 etapas.',
    'https://i.pinimg.com/1200x/0c/dd/f1/0cddf1a088784488cc73ffbedfa53ebf.jpg',
    ['https://i.pinimg.com/736x/ed/d3/f2/edd3f267f2d995ca3ddd2f4316a2ea66.jpg',
      'https://i.pinimg.com/736x/26/59/83/26598308d3e280c3e5c12172fd30e8bc.jpg',
      'https://i.pinimg.com/736x/c4/19/c5/c419c52357f3293954cb12235bb8a567.jpg']
  ],
  ['kit-kerastase-chronologiste', 'kit', 'Kérastase Chronologiste Kit', 'Regeneração e Brilho',
    'Óleo Regenerador + Protetor Térmico Chronologiste. Nutrição profunda e proteção térmica. Uso diário, antes e após a modelagem.',
    'https://i.pinimg.com/736x/c1/4a/bb/c14abbd5fb1d4528ab1371784cd4503b.jpg',
    ['https://i.pinimg.com/1200x/0d/39/ae/0d39aeeb056fd43fc060a56555480565.jpg',
      'https://i.pinimg.com/736x/85/2f/4d/852f4d0951ce8b754038f12f99c8b4ed.jpg',
      'https://i.pinimg.com/1200x/81/a8/bf/81a8bf33b07433341cb8f58c305bf429.jpg']
  ],
  ['kit-kerastase-thermique', 'kit', 'Kérastase Thermique Kit', 'Proteção Térmica',
    'Protetor Térmico + Óleo Finalizador. Proteção até 230°C e brilho intenso. Uso diário, antes da secagem.',
    'https://i.pinimg.com/1200x/40/7e/87/407e877f2325ceded92fd59cee423193.jpg',
    ['https://i.pinimg.com/1200x/c1/3e/5d/c13e5d4ba01867b5a2de1a677d09302d.jpg',
      'https://i.pinimg.com/736x/a8/b6/fd/a8b6fddb483f3e94c5fd303b373af19c.jpg',
      'https://i.pinimg.com/736x/c5/31/c6/c531c62a3624f7dde4cdc2ee8ef6d8b6.jpg']
  ],
  ['kit-kerastase-resistance-mask', 'kit', 'Kérastase Resistance Mask Kit', 'Reconstrução Profunda',
    '2 unidades da Máscara Resistance. Tratamento intensivo para fibra danificada. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/736x/40/b8/c2/40b8c22108d5712a18d9ecd02d5233d5.jpg',
    ['https://i.pinimg.com/736x/91/e6/86/91e6865f11d7e3d1d6a0677131597e2b.jpg',
      'https://i.pinimg.com/1200x/b1/9c/a6/b19ca6af05a7a9ac8fc0b1f93982c3ce.jpg',
      'https://i.pinimg.com/736x/f5/bc/0c/f5bc0c52fd5347eb388ad6a51cb6d010.jpg']
  ],
  ['kit-kerastase-hydration', 'kit', 'Kérastase Hydration Kit', 'Hidratação Essencial',
    'Shampoo + Condicionador + Máscara Nutritive. Hidratação intensa para cabelos secos. Uso semanal, em 3 etapas.',
    'https://i.pinimg.com/1200x/5e/59/9d/5e599d616ffdb609f55cc48a92832340.jpg',
    ['https://i.pinimg.com/736x/4a/a3/f4/4aa3f4b472556d5aa8e6ad2f66bd0595.jpg',
      'https://i.pinimg.com/1200x/ae/a4/60/aea460c2d74ca14511976aab025a01cf.jpg',
      'https://i.pinimg.com/236x/8f/46/30/8f463046ad92a0bc308d9c9a68e30d52.jpg']
  ],
  ['kit-joico-moisture', 'kit', 'Joico Moisture Recovery Kit', 'Hidratação Profunda',
    'Shampoo + Condicionador + Máscara Moisture Recovery. Hidratação profunda com Bio-Advanced Peptide. Uso semanal, em 3 etapas.',
    'https://i.pinimg.com/1200x/55/d6/10/55d610f599b3c10b5fe4cafceb5104fc.jpg',
    ['https://i.pinimg.com/1200x/37/eb/38/37eb38f29a15f9f2b571ef4c72e9ae73.jpg',
      'https://i.pinimg.com/736x/67/be/08/67be084978b5c1f0fdf7170ccb071d9e.jpg',
      'https://i.pinimg.com/1200x/f0/39/f9/f039f9d99452b6304575864a8695a88b.jpg']
  ],
  ['kit-joico-color-endure', 'kit', 'Joico Color Endure Kit', 'Proteção de Cor',
    'Shampoo + Condicionador Color Endure. Protege e prolonga a durabilidade da cor. Uso diário, em 2 etapas.',
    'https://i.pinimg.com/736x/ed/92/df/ed92dfe26b5bf8d567ffc982ec8335a9.jpg',
    ['https://i.pinimg.com/736x/55/f6/fb/55f6fbc94440f61acd2b29ce3a0ec87f.jpg',
      'https://i.pinimg.com/736x/81/5d/a5/815da5dd12b7f501add1182400694ef1.jpg',
      'https://i.pinimg.com/1200x/c8/45/45/c8454574dc124e61c5ff54b0fa7b4e87.jpg']
  ],
  ['kit-joico-defy-damage', 'kit', 'Joico Defy Damage Kit', 'Defesa Antidano',
    'Shampoo + Condicionador + Leave-in Defy Damage. Proteção contra danos diários. Uso diário, em 3 etapas.',
    'https://i.pinimg.com/236x/0b/92/13/0b9213aaedddaf68940bb3a89fb62dc8.jpg',
    ['https://i.pinimg.com/736x/36/a4/ec/36a4ec1861b63319fe1e9cdd71b533b6.jpg',
      'https://i.pinimg.com/1200x/d4/7b/cb/d47bcb80c0e571e40b7fc11b454f5059.jpg',
      'https://i.pinimg.com/736x/a5/87/83/a5878313d7f90c8a328fddb978de7d34.jpg']
  ],
  ['kit-joico-moisture-mask', 'kit', 'Joico Moisture Mask Kit', 'Hidratação Intensiva',
    '2 unidades da Máscara Moisture Recovery. Repõe umidade e devolve brilho. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/736x/ca/c4/15/cac415197ee2db5b5d7a12890b225b9a.jpg',
    ['https://i.pinimg.com/736x/23/cf/33/23cf33cee26dfb383d78663dfd23b864.jpg',
      'https://i.pinimg.com/736x/ec/b3/8b/ecb38bd4b30677f9ec9b63fb3b274c6e.jpg',
      'https://i.pinimg.com/736x/6d/38/3b/6d383b8f18eae583c30adb655611d86d.jpg']
  ],
  ['kit-joico-Volumizing', 'kit', 'Joico Volumizing Kit', 'Volume e Leveza',
    'Shampoo + Condicionador Volumizing. Proporciona volume, corpo e leveza. Uso diário, em 2 etapas.',
    'https://i.pinimg.com/1200x/94/ff/44/94ff449ed215781b29fa5555920ea95a.jpg',
    ['https://i.pinimg.com/736x/b1/79/cd/b179cdd3c0691a77521b5246a61e4add.jpg',
      'https://i.pinimg.com/736x/1d/bc/24/1dbc2405985303d3d5456ea919dfd899.jpg',
      'https://i.pinimg.com/736x/cf/87/e8/cf87e8b258211b1ec6f288dc243adc80.jpg']
  ],
  ['kit-expert-absolut-repair', 'kit', 'Expert Absolut Repair Kit', 'Reconstrução Completa',
    'Shampoo + Condicionador + Máscara Absolut Repair. Reconstrução com Lipid-Repair. Uso semanal, em 3 etapas.',
    'https://i.pinimg.com/736x/e3/5e/2c/e35e2c9e9d5e31aac8793ea1cc1ebb19.jpg',
    ['https://i.pinimg.com/736x/5c/82/2c/5c822c9dcd5ecae1bda1ee964bd8eeb1.jpg',
      'https://i.pinimg.com/736x/6d/55/05/6d55050a72f3a6e613c062c5f1a2a047.jpg',
      'https://i.pinimg.com/736x/a4/8c/7f/a48c7f2e1b5d9a3c6e8b4d2f7a1c5e93.jpg']
  ],
  ['kit-expert-vitamino-color', 'kit', 'Expert Vitamino Color Kit', 'Proteção de Cor Diária',
    'Shampoo + Condicionador Vitamino Color. Protege e intensifica o brilho dos fios coloridos. Uso diário, em 2 etapas.',
    'https://i.pinimg.com/736x/f6/51/d6/f651d62a113c18ac4101aa31c2cec0d0.jpg',
    ['https://i.pinimg.com/1200x/85/4e/02/854e02ce74bf9af04d04cbf86830e14c.jpg',
      'https://i.pinimg.com/1200x/3e/ae/bb/3eaebbaa9f8e58142b50b6d713d9ce49.jpg',
      'https://i.pinimg.com/736x/38/43/23/384323902c28e3c7a44a03ae06db29b7.jpg']
  ],
  ['kit-expert-metal-detox', 'kit', 'Expert Metal Detox Kit', 'Desintoxicação Capilar',
    'Tratamento + Shampoo Metal Detox. Remove metais e garante cor uniforme. Uso pré-coloração, em 2 etapas.',
    'https://i.pinimg.com/736x/3d/0f/ec/3d0fece6981e4f8fedac2225a2515c96.jpg',
    ['https://i.pinimg.com/736x/dd/fa/e3/ddfae3b1f8f559f1843aea2610ac3176.jpg',
      'https://i.pinimg.com/1200x/b8/6e/fe/b86efec2e8686d63a0ab7149e0ff6f54.jpg',
      'https://i.pinimg.com/1200x/dd/fd/86/ddfd86b022f90fb7491aea4eb55b76d3.jpg']
  ],
  ['kit-expert-absolut-repair-mask', 'kit', 'Expert Absolut Repair Mask Kit', 'Reconstrução Profunda',
    '2 unidades da Máscara Absolut Repair. Recupera a fibra severamente danificada. Uso semanal, após o shampoo.',
    'https://i.pinimg.com/736x/11/51/da/1151da5401aa1ff0533a5a2e221488ab.jpg',
    ['https://i.pinimg.com/736x/e5/5f/83/e55f83ba1959fc476a7d340f488c3a1a.jpg',
      'https://i.pinimg.com/736x/79/9b/c9/799bc972103f05b8e50a5e4d3337c14b.jpg',
      'https://i.pinimg.com/736x/3a/43/ef/3a43efa8384793d904ed8aee02c9d172.jpg']
  ],
  ['kit-expert-serum', 'kit', 'Expert Serum Kit', 'Brilho e Maciez',
    'Sérum Finalizador + Óleo Capilar. Brilho intenso, maciez e proteção. Uso diário, após a modelagem.',
    'https://i.pinimg.com/736x/19/57/93/1957934cfe15752a65f5bd14dff91a7a.jpg',
    ['https://i.pinimg.com/1200x/d1/94/cf/d194cf9242db006d8c2340d16c656c18.jpg',
      'https://i.pinimg.com/736x/73/70/87/737087916e22525775a637957ab6962f.jpg',
      'https://i.pinimg.com/1200x/64/3d/8d/643d8de41d7c632d14be74923199d10a.jpg']
  ]
];


// ============================================================
// 9. DADOS: FERRAMENTAS (15 itens)
// ============================================================
var ferramentasData = [
  ['secador-ionico-pro', 'ferramentas', 'Secador Iônico Pro', 'Secagem Rápida e Antifrizz',
    'Secador com tecnologia iônica que reduz frizz e acelera a secagem. Ideal para uso profissional e doméstico. Potência alta com controle de temperatura.',
    'https://i.pinimg.com/736x/7f/4d/8b/7f4d8b424f29dffaa67ad8856df09263.jpg',
    ['https://i.pinimg.com/1200x/ef/ef/f4/efeff4b83e8aecf58644af080c24e4ac.jpg',
      'https://i.pinimg.com/736x/41/31/08/4131089e2d531379ade8f1ac547246bd.jpg',
      'https://i.pinimg.com/736x/51/d7/fe/51d7fe3f8c05b4ddfbfc1ca2e0c4e996.jpg']
  ],
  ['prancha-titanium', 'ferramentas', 'Prancha de Titânio', 'Alisamento Uniforme',
    'Prancha com placas de titânio para alta condução de calor. Ideal para alisamento profissional. Temperatura uniforme e deslizamento suave.',
    'https://i.pinimg.com/1200x/e7/b6/e1/e7b6e1de363429ccf8f85d02f6c3abbc.jpg',
    ['https://i.pinimg.com/736x/69/a2/4c/69a24ce045d17b1f16c50789eafc00fb.jpg',
      'https://i.pinimg.com/736x/5e/12/e6/5e12e630cc54a79d81b0e6c504eed9d5.jpg',
      'https://i.pinimg.com/1200x/21/0c/ec/210cec95d149ae3e8622ae3441d830ed.jpg']
  ],
  ['modelador-ondas', 'ferramentas', 'Modelador de Ondas', 'Ondas Perfeitas',
    'Modelador térmico para ondas marcadas e regulares. Ideal para uso profissional e doméstico. Trabalha mechas com uniformidade.',
    'https://i.pinimg.com/736x/e5/5c/8d/e55c8d124b8fbd55f7a2a45f6a238dd7.jpg',
    ['https://i.pinimg.com/736x/2c/ee/a8/2ceea8d25dc03ce7b4961da20d619a77.jpg',
      'https://i.pinimg.com/736x/cc/b2/64/ccb2645665518c74182d633f4586b005.jpg',
      'https://i.pinimg.com/736x/14/12/e1/1412e160d106839a11b2a8cdfae2654c.jpg']
  ],
  ['babyliss-ceramica', 'ferramentas', 'Babyliss Cerâmica', 'Cachos Definidos',
    'Modelador cilíndrico cerâmico para cachos e ondas. Ideal para todos os tipos de cabelo. Controle de temperatura ajustável.',
    'https://i.pinimg.com/736x/ff/a3/ae/ffa3ae40d17685e0321de9ca3e27a41d.jpg',
    ['https://i.pinimg.com/1200x/6e/b6/79/6eb6797d78cbe5606ad9d29998eb75e5.jpg',
      'https://i.pinimg.com/736x/5d/9f/97/5d9f9707aaf6d4c444e2d65da38fcd5b.jpg',
      'https://i.pinimg.com/1200x/b9/58/75/b95875d1a7945aaab782f67e382ba4ff.jpg']
  ],
  ['escova-rotativa', 'ferramentas', 'Escova Rotativa', 'Modelagem e Volume',
    'Escova de ar quente que combina secagem e modelagem. Ideal para uso profissional e doméstico. Cria volume e acabamento alinhado.',
    'https://i.pinimg.com/736x/26/b8/ba/26b8ba113a222d08c5a7ececcf00cecf.jpg',
    ['https://i.pinimg.com/736x/73/5a/0e/735a0e7eda137b5fd090530a3f7321d0.jpg',
      'https://i.pinimg.com/1200x/1d/4f/38/1d4f389fec6dfa518585926148342c42.jpg',
      'https://i.pinimg.com/736x/26/b8/ba/26b8ba113a222d08c5a7ececcf00cecf.jpg']
  ],
  ['tesoura-profissional', 'ferramentas', 'Tesoura Profissional', 'Corte de Precisão',
    'Tesoura para cortes técnicos e acabamento preciso. Ideal para uso profissional. Design ergonômico e fio de alta durabilidade.',
    'https://i.pinimg.com/736x/6b/05/1d/6b051d5086bf9f85682e686e181bcf10.jpg',
    ['https://i.pinimg.com/1200x/7c/2e/ea/7c2eea5dd695bd9df6ab6524387652c6.jpg',
      'https://i.pinimg.com/1200x/aa/2d/20/aa2d2071d977ea08ae16bab3ee8b8466.jpg',
      'https://i.pinimg.com/1200x/20/d4/05/20d4052d35ab73cb838683fdc18df058.jpg']
  ],
  ['escova-cerdas-naturais', 'ferramentas', 'Escova de Cerdas Naturais', 'Acabamento e Brilho',
    'Cerdas naturais para pentear e distribuir oleosidade. Ideal para todos os tipos de cabelo. Proporciona acabamento polido.',
    'https://i.pinimg.com/736x/32/2f/20/322f20b363ee6487911c3817f293dd21.jpg',
    ['https://i.pinimg.com/736x/f0/a4/11/f0a411143156c8668bd4f6ae64e55f25.jpg',
      'https://i.pinimg.com/1200x/02/42/35/024235cc5d211b0a9e05b2e9883886e7.jpg',
      'https://i.pinimg.com/1200x/62/31/ba/6231ba96187c6edeb9cc78a99fc823de.jpg']
  ],
  ['maquina-corte', 'ferramentas', 'Máquina de Corte', 'Degradê e Aparo',
    'Máquina com lâmina ajustável para cortes, contornos e degradês. Ideal para uso profissional. Alta precisão no acabamento.',
    'https://i.pinimg.com/736x/00/2b/50/002b5062b94512b47d3916ecf55212d3.jpg',
    ['https://i.pinimg.com/736x/fd/46/b1/fd46b19a09a5a83e1eedd7a544be466b.jpg',
      'https://i.pinimg.com/736x/dc/f8/3e/dcf83e5930d2ff7b0af588b1f7ba1791.jpg',
      'https://i.pinimg.com/736x/be/3d/a8/be3da8c62a5a3bdd21cc5605abd23e54.jpg']
  ],
  ['difusor-universal', 'ferramentas', 'Difusor Universal', 'Cachos sem Frizz',
    'Acessório para secador que distribui o ar de forma ampla. Ideal para cacheados e ondulados. Preserva a forma dos cachos.',
    'https://i.pinimg.com/736x/de/d6/1f/ded61f2c199f9e13e40fd64d3aa51708.jpg',
    ['https://i.pinimg.com/1200x/3e/15/a6/3e15a66f16a649716a2b7c69b611062a.jpg',
      'https://i.pinimg.com/1200x/fe/97/ff/fe97ff246be6747be32d4c6af87789ce.jpg',
      'https://i.pinimg.com/736x/40/94/40/409440dabf1d219f45e92534b7da1e8d.jpg']
  ],
  ['escova-termica-alisadora', 'ferramentas', 'Escova Térmica Alisadora', 'Alisamento e Modelagem',
    'Escova elétrica com superfície aquecida para alisar e modelar. Ideal para retoques rápidos. Desliza com facilidade nos fios.',
    'https://i.pinimg.com/736x/fe/02/a6/fe02a6570cf649da1defec4455a46b2d.jpg',
    ['https://i.pinimg.com/736x/5e/c3/db/5ec3dbbf91dba4dbff59fdd7f3c57c00.jpg',
      'https://i.pinimg.com/736x/7e/72/8d/7e728d6281c3f99dec672f9cfe638375.jpg',
      'https://i.pinimg.com/736x/74/e2/a6/74e2a672b7ebe13187e0d7ec5ed2a36d.jpg']
  ],
  ['escova-paddle', 'ferramentas', 'Escova Paddle', 'Desembaraçar e Alisar',
    'Base larga e plana para desembaraçar e alinhar. Ideal para cabelos médios e longos. Trabalha grandes seções com rapidez.',
    'https://i.pinimg.com/1200x/49/36/a0/4936a0c18a5b237312f90b674f9b45db.jpg',
    ['https://i.pinimg.com/1200x/5f/f6/73/5ff673fcb94edbaa319ec3da502cc7a6.jpg',
      'https://i.pinimg.com/736x/91/b1/90/91b1905d8a7c17206f3a1671d1954a05.jpg',
      'https://i.pinimg.com/736x/45/c4/4b/45c44b757a8b4a1191d7276048e597b8.jpg']
  ],
  ['escova-termica', 'ferramentas', 'Escova Térmica', 'Modelagem com Brilho',
    'Escova redonda com cilindro cerâmico para secagem. Ideal para uso profissional e doméstico. Distribui calor uniformemente.',
    'https://i.pinimg.com/736x/f3/b8/14/f3b8140efec0fd25bee16ede2f9effb2.jpg',
    ['https://i.pinimg.com/736x/80/79/77/8079773d48fc57850c5ed932e3ae69b8.jpg',
      'https://i.pinimg.com/736x/5d/47/ff/5d47ffffde26ab74dfadee1bdf9dfcd3.jpg',
      'https://i.pinimg.com/736x/8d/5b/e7/8d5be7313f6720b5cfe57b3da3523b7a.jpg']
  ],
  ['escova-madeira', 'ferramentas', 'Escova de Madeira', 'Antiestática e Natural',
    'Corpo de madeira com cerdas naturais para pentear e massagear. Ideal para uso diário. Efeito antiestático natural.',
    'https://i.pinimg.com/1200x/c5/8b/07/c58b07b61ad05709df43c3b92cd24e5c.jpg',
    ['https://i.pinimg.com/1200x/34/f1/0b/34f10b055e1b0b0d107737fa5ae04fed.jpg',
      'https://i.pinimg.com/736x/b5/0b/3b/b50b3bccf7ab2db949e26faafdbbb339.jpg',
      'https://i.pinimg.com/736x/9c/17/50/9c1750c276319824a659ce755c652be4.jpg']
  ],
  ['massageador-capilar', 'ferramentas', 'Massageador Capilar', 'Estímulo e Relaxamento',
    'Pontas de silicone para massagear o couro cabeludo. Ideal para higienização e relaxamento. Estimula a circulação.',
    'https://i.pinimg.com/1200x/3d/a9/f2/3da9f25d3ffb632da87d0f1fb4189250.jpg',
    ['https://i.pinimg.com/1200x/37/84/ad/3784ad0486d8e36d4dad6dfc1bbc646c.jpg',
      'https://i.pinimg.com/736x/2e/4b/35/2e4b353192b23a4a4314aa72693dc6ae.jpg',
      'https://i.pinimg.com/736x/4b/37/53/4b375331adfc3ab8dd94c27cfd6e5e37.jpg']
  ],
  ['touca-termica', 'ferramentas', 'Touca Térmica', 'Potencializa Tratamentos',
    'Mantém o cabelo aquecido uniformemente durante tratamentos. Ideal para hidratação e reconstrução. Potencializa a absorção dos ativos.',
    'https://i.pinimg.com/736x/e0/fd/95/e0fd9535ba1eea5eeaff20e49bfc7308.jpg',
    ['https://i.pinimg.com/1200x/8c/5f/e7/8c5fe75321e624f96287da2885a79201.jpg',
      'https://i.pinimg.com/736x/4f/cd/7f/4fcd7f37e266061e2d8691fb59e2e5d3.jpg',
      'https://i.pinimg.com/736x/04/79/1f/04791ffd29b9c9ceac9f42102bd01031.jpg']
  ]
];


// ============================================================
// 10. BOOTSTRAP — constrói styleData global
// ============================================================
var styleData = {};

function addItemsToStyleData(dataArray) {
  dataArray.forEach(function (raw) {
    var norm = normalizeItem(raw);
    styleData[norm.id] = createCard(norm.id, norm.cat, norm.corte,
      norm.title, norm.desc, norm.img, norm.variants, norm.prompt);
  });
}

addItemsToStyleData(cortesData);
addItemsToStyleData(coloracoesData);
addItemsToStyleData(produtosData);
addItemsToStyleData(kitsData);
addItemsToStyleData(ferramentasData);
