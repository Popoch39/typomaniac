// What stands for a User in the Duel's HUD, as on its board: the first two characters of their
// Handle, in capitals (« popoch » is PO, « kzr_ » is KZ).
export const handleInitials = (handle: string) => handle.slice(0, 2).toUpperCase();
