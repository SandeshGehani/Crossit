/**
 * WhatsApp reminder link generator
 */

/**
 * Generate a WhatsApp deep link with a pre-filled reminder message
 * @param {string} phoneNumber - Phone number with country code (e.g., "+923001234567")
 * @param {string} personName - Name of the person
 * @param {number} amountPaisa - Amount owed in paisa
 * @param {string} note - Optional note about the debt
 * @returns {string} WhatsApp deep link URL
 */
export function generateWhatsAppLink(phoneNumber, personName, amountPaisa, note = '') {
  const rupees = (Math.abs(amountPaisa) / 100).toFixed(2);
  
  let message = `Hi ${personName}! 👋\n\n`;
  message += `This is a friendly reminder about an outstanding amount of Rs.${rupees}`;
  if (note) {
    message += ` for "${note}"`;
  }
  message += `.\n\nWould you be able to settle this when convenient? 🙏\n\n`;
  message += `— Sent via Crossit`;

  const encodedMessage = encodeURIComponent(message);
  
  if (phoneNumber) {
    // Remove any non-digit characters except the leading +
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '').replace(/^\+/, '');
    return `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
  }
  
  // Fallback: no phone number, return just the message for copying
  return null;
}

/**
 * Get the reminder message text (for copy-to-clipboard fallback)
 */
export function getReminderMessage(personName, amountPaisa, note = '') {
  const rupees = (Math.abs(amountPaisa) / 100).toFixed(2);
  
  let message = `Hi ${personName}! 👋\n\n`;
  message += `This is a friendly reminder about an outstanding amount of Rs.${rupees}`;
  if (note) {
    message += ` for "${note}"`;
  }
  message += `.\n\nWould you be able to settle this when convenient? 🙏`;
  
  return message;
}
