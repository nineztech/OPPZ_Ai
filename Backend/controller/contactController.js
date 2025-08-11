 import Contact from '../model/Contact.js';

export const submitContactForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, message } = req.body;

    const contactEntry = await Contact.create({
      firstName,
      lastName,
      email,
      phone,
      message
    });

    res.status(201).json({ success: true, data: contactEntry });
  } catch (error) {
    console.error('Error saving contact:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
