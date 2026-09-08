/**
 * Referencias de los datos que aparecen en las fichas.
 * Se muestran en el pie de la aplicación para respaldar el contenido.
 */
export type Fuente = { id: string; cita: string; url: string }

export const FUENTES: Fuente[] = [
  {
    id: 'hipocampo',
    cita: 'Maguire et al. (2000). Navigation-related structural change in the hippocampi of taxi drivers. PNAS 97(8):4398-4403.',
    url: 'https://www.pnas.org/doi/10.1073/pnas.070039597',
  },
  {
    id: 'insula',
    cita: 'Naqvi, Rudrauf, Damasio & Bechara (2007). Damage to the insula disrupts addiction to cigarette smoking. Science 315(5811):531-534.',
    url: 'https://www.science.org/doi/10.1126/science.1135926',
  },
  {
    id: 'amigdala',
    cita: 'Whalen et al. (1998). Masked presentations of emotional facial expressions modulate amygdala activity without explicit knowledge. J. Neurosci. 18(1):411-418.',
    url: 'https://www.jneurosci.org/content/18/1/411',
  },
  {
    id: 'giro_del_cingulo',
    cita: 'Eisenberger, Lieberman & Williams (2003). Does rejection hurt? An fMRI study of social exclusion. Science 302(5643):290-292.',
    url: 'https://www.science.org/doi/10.1126/science.1089134',
  },
  {
    id: 'area_prefrontal',
    cita: 'Gogtay et al. (2004). Dynamic mapping of human cortical development during childhood through early adulthood. PNAS 101(21):8174-8179.',
    url: 'https://www.pnas.org/doi/10.1073/pnas.0402680101',
  },
  {
    id: 'area_de_broca',
    cita: 'Broca, P. (1861). Remarques sur le siège de la faculté du langage articulé. Bulletin de la Société Anatomique de Paris 6:330-357.',
    url: 'https://wellcomecollection.org/works/qsn2nswq',
  },
  {
    id: 'nucleo_accumbens',
    cita: 'Schultz, Dayan & Montague (1997). A neural substrate of prediction and reward. Science 275(5306):1593-1599.',
    url: 'https://www.science.org/doi/10.1126/science.275.5306.1593',
  },
  {
    id: 'anatomia',
    cita: 'Geometría y posiciones basadas en centroides estándar del espacio MNI152 (atlas Harvard-Oxford / AAL).',
    url: 'https://www.sciencedirect.com/science/article/abs/pii/S1053811906000437',
  },
]
