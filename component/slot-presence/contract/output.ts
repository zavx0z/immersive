/**
Наличие непустого назначенного содержимого в текущем render.
Ноль является содержимым; null, undefined, boolean, пустая строка и пустая
группа — нет. Fallback принимающего slot в эту проверку не входит.
*/
export type SlotPresenceOutput = boolean
