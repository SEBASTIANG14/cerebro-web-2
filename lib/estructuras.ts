import geometria from './geometria.json'

export type Rol = 'context' | 'surface' | 'shell' | 'deep'

export type Geometria = {
  centro: [number, number, number]
  ancla: [number, number, number]
  radio: number
  bbox: [[number, number, number], [number, number, number]]
  rol: Rol
  tris: number
  color: [number, number, number]
}

export type Estructura = {
  id: string
  nombre: string
  etiqueta: string          // una o dos palabras para la lista
  funcion?: string          // que hace
  palabrasClave: string[]   // palabras clave
  dato?: string             // el dato llamativo
  ubicacion?: string        // donde esta, en lenguaje llano
  lado: 'Bilateral' | 'Hemisferio izquierdo'
  color: string             // color de resalte (hex)
  geo: Geometria
}

const G = geometria as unknown as Record<string, Geometria>

/** Contenido de las fichas. Fuentes en `lib/fuentes.ts`. */
const CONTENIDO: Omit<Estructura, 'geo'>[] = [
  {
    id: 'area_prefrontal',
    nombre: 'Área prefrontal',
    etiqueta: 'Prefrontal',
    palabrasClave: ['Planificación', 'Toma de decisiones', 'Control de impulsos', 'Personalidad'],
    funcion:
      'Planifica, decide, frena impulsos y sostiene lo que hoy llamamos personalidad y criterio.',
    dato:
      'Es la última zona de la corteza en terminar de madurar: sigue afinando y recubriendo sus conexiones hasta bien entrada la veintena.',
    ubicacion: 'Toda la parte anterior del lóbulo frontal, por delante de las áreas motoras.',
    lado: 'Bilateral',
    color: '#3dbe9b',
  },
  {
    id: 'amigdala',
    nombre: 'Amígdala cerebral',
    etiqueta: 'Amígdala',
    palabrasClave: ['Detección de amenazas', 'Respuesta al miedo', 'Memoria emocional', 'Alerta'],
    funcion:
      'Detecta lo que puede ser una amenaza y le pone carga emocional a la experiencia, sobre todo al miedo.',
    dato:
      'Se activa ante un rostro de miedo aunque se muestre tan brevemente que no llegas a verlo de forma consciente.',
    ubicacion: 'En la profundidad del lóbulo temporal, justo delante del hipocampo.',
    lado: 'Bilateral',
    color: '#e63d52',
  },
  {
    id: 'hipocampo',
    nombre: 'Hipocampo',
    etiqueta: 'Hipocampo',
    palabrasClave: ['Memoria a largo plazo', 'Consolidación de recuerdos', 'Orientación espacial'],
    funcion:
      'Convierte lo que vives en memoria duradera y construye tu mapa mental del espacio.',
    dato:
      'Los taxistas de Londres, que memorizan 25 000 calles para obtener la licencia, tienen mayor volumen en el hipocampo posterior — y la diferencia crece con los años al volante.',
    ubicacion: 'Enrollado en la cara interna del lóbulo temporal, con forma de caballito de mar.',
    lado: 'Bilateral',
    color: '#f27a47',
  },
  {
    id: 'ganglios_basales',
    nombre: 'Ganglios basales',
    etiqueta: 'Ganglios basales',
    palabrasClave: ['Control motor', 'Hábitos automáticos', 'Inicio del movimiento', 'Rutinas'],
    funcion:
      'Seleccionan qué movimiento arranca y cuál se frena; con la repetición convierten una acción en hábito automático.',
    dato:
      'Cuando la dopamina que los alimenta se agota aparece el Parkinson: el cerebro sabe perfectamente qué movimiento quiere hacer, pero no consigue ponerlo en marcha.',
    ubicacion: 'Núcleo caudado, putamen y globo pálido, agrupados alrededor del tálamo.',
    lado: 'Bilateral',
    color: '#5c99ea',
  },
  {
    id: 'giro_del_cingulo',
    nombre: 'Giro del cíngulo',
    etiqueta: 'Cíngulo',
    palabrasClave: ['Regulación emocional', 'Detección de errores', 'Atención y dolor', 'Empatía'],
    funcion:
      'Enlaza emoción, atención y dolor. Avisa cuando algo no sale como esperabas y hay que corregir.',
    dato:
      'Su porción anterior se activa de forma parecida ante el dolor físico y ante el rechazo social: para el cerebro, quedarse fuera del grupo se parece bastante a hacerse daño.',
    ubicacion: 'Arco en la cara interna de cada hemisferio, abrazando al cuerpo calloso.',
    lado: 'Bilateral',
    color: '#6bd15c',
  },
  {
    id: 'insula',
    nombre: 'Ínsula',
    etiqueta: 'Ínsula',
    palabrasClave: ['Interocepción', 'Conciencia corporal', 'Emoción consciente', 'Sensación visceral'],
    funcion:
      'Escucha el cuerpo por dentro —hambre, latido, náusea, respiración— y lo traduce en emoción consciente.',
    dato:
      'Es la única corteza que queda totalmente enterrada: hay que separar los lóbulos para verla. Fumadores que sufrieron una lesión en ella dejaron el tabaco de golpe y sin esfuerzo.',
    ubicacion: 'En el fondo de la cisura de Silvio, tapada por los lóbulos frontal y temporal.',
    lado: 'Bilateral',
    color: '#fa9eb8',
  },
  {
    id: 'area_de_wernicke',
    nombre: 'Área de Wernicke',
    etiqueta: 'Wernicke',
    palabrasClave: ['Comprensión del lenguaje', 'Decodificación auditiva', 'Semántica', 'Procesamiento verbal'],
    funcion: 'Da sentido a las palabras que oyes y lees: es la comprensión del lenguaje.',
    dato:
      'Si se lesiona, la persona sigue hablando con fluidez y buena entonación, pero las frases pierden el sentido — y a menudo no se da cuenta de ello.',
    ubicacion: 'Parte posterior del giro temporal superior, bajo la cisura de Silvio.',
    lado: 'Hemisferio izquierdo',
    color: '#338cf2',
  },
  {
    id: 'area_de_broca',
    nombre: 'Área de Broca',
    etiqueta: 'Broca',
    palabrasClave: ['Producción del habla', 'Articulación vocal', 'Estructura gramatical', 'Expresión verbal'],
    funcion: 'Organiza y articula el lenguaje que produces: convierte la idea en frase hablada.',
    dato:
      'El primer paciente que describió Paul Broca en 1861 entendía todo lo que le decían, pero solo era capaz de pronunciar una sílaba: «tan».',
    ubicacion: 'Giro frontal inferior, justo por delante del área motora de la boca.',
    lado: 'Hemisferio izquierdo',
    color: '#fa8c1a',
  },
  {
    id: 'nucleo_accumbens',
    nombre: 'Núcleo accumbens',
    etiqueta: 'Accumbens',
    palabrasClave: ['Circuito de recompensa', 'Motivación y placer', 'Anticipación', 'Refuerzo'],
    funcion:
      'Centro de la motivación y la recompensa: traduce el «esto me interesa» en «voy a por ello».',
    dato:
      'No se dispara tanto con el premio como con anticiparlo. Responde más a la expectativa que a la recompensa en sí — y por ahí entran las adicciones.',
    ubicacion: 'En la base del cerebro, donde se unen la cabeza del caudado y el putamen.',
    lado: 'Bilateral',
    color: '#fac633',
  },
  {
    id: 'area_tegmental_ventral',
    nombre: 'Área tegmental ventral',
    etiqueta: 'ATV',
    palabrasClave: ['Producción de dopamina', 'Impulso vital', 'Vía de recompensa', 'Refuerzo neuronal'],
    funcion:
      'La fábrica de dopamina del cerebro: envía sus fibras al núcleo accumbens y a la corteza prefrontal.',
    dato:
      'Ocupa poco más de medio centímetro cúbico por lado, pero sus axones modulan la motivación, el aprendizaje y el placer de todo el cerebro.',
    ubicacion: 'En el mesencéfalo, junto a la línea media, dentro del tronco encefálico.',
    lado: 'Bilateral',
    color: '#9e5cdb',
  },
]

export const ESTRUCTURAS: Estructura[] = CONTENIDO.map((c) => ({
  ...c,
  geo: G[c.id],
})).filter((e) => e.geo)

export const POR_ID = new Map(ESTRUCTURAS.map((e) => [e.id, e]))

/** Mallas de contexto: no son seleccionables, dan el marco anatómico. */
export const CONTEXTO = ['cortex', 'cerebelo', 'tronco'] as const

export const GEOMETRIA = G
