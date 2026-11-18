// As datas da API são texto AAAA-MM-DD. Para calcular, monta-se a data local em vez de usar
// new Date(texto), que lê em UTC e pode voltar um dia.

export function hojeISO(base: Date = new Date()): string {
  return base.toLocaleDateString('sv-SE');
}

function paraDate(iso: string): Date {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(ano, mes - 1, dia);
}

export function diasEntre(deISO: string, ateISO: string): number {
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round((paraDate(ateISO).getTime() - paraDate(deISO).getTime()) / umDia);
}

// Ex.: "Hoje · Terça-feira, 17 de novembro"
export function tituloDoDia(iso: string, hoje: string = hojeISO()): string {
  const texto = paraDate(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const completa = texto.charAt(0).toUpperCase() + texto.slice(1);
  const diferenca = diasEntre(hoje, iso);

  if (diferenca === 0) return `Hoje · ${completa}`;
  if (diferenca === 1) return `Amanhã · ${completa}`;
  return completa;
}
