const weekday = new Date().toLocaleDateString("pt-BR", { weekday: "long" });

export const prefixes = [
  "Mas também, ",
  "Aí também, ",
  "Tu também né, ",
  "Complicado, ",
  "Aí também, ",
  "Minha nossa, ",
  "Também não ajuda, ",
  "Quer o quê também? ",
];

export const excuses = [
  "tu já chega aí todo errado.",
  "tu não reza mais antes de dormir.",
  "tu só fica nesse computador.",
  "tu acorda meio-dia e quer milagre.",
  "tu deixa tudo pra última hora.",
  "tu não lê nem as instruções e quer que dê certo.",
  "tu não sabe esperar cinco minutos.",
  "tu vive inventando moda.",
  "tu nem benzeu o computador antes de ligar.",
  "nem arrumou a cama direito e quer que funcione.",
  "o servidor viu tua requisição e desistiu.",
  "tu tá testando a paciência da tecnologia.",
  "tu chega e não dá nem bom dia.",
  "até funcionaria, mas resolveu não funcionar.",
  "o cache guardou rancor.",
  "até o log de erro ficou sem palavras.",
  "o bug decidiu aparecer em produção.",
  "o sistema detectou excesso de confiança.",
  "o bug tava quieto até tu interagir.",
  `o sistema ficou sabendo que hoje é ${weekday.at(0)?.toUpperCase() + weekday.slice(1)}.`,
];
