import { FaWhatsapp, FaInstagram, FaLinkedin } from "react-icons/fa";

export default async function SuportPage() {
    return (
        <div className="flex min-h-screen flex-col">
            <main className="flex-1 container mx-auto py-6 px-4">
                <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">Suporte</h1>
                            <p className="text-muted-foreground mt-1">Tem alguma dúvida? Entre em contato conosco:</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h2 className="text-xl font-bold">Formas de contato</h2>
                            <ul className="list-disc pl-5 text-muted-foreground">
                                <li>Email: <a href="mailto:konvertacrm@gmail.com" className="text-blue-600 hover:underline">konvertacrm@gmail.com</a></li>
                                <li>WhatsApp: <a href="https://wa.me/5579991190534" target="_blank" className="text-blue-600 hover:underline">+55 (79) 9 9119-0534</a></li>
                                <li>Horário de atendimento: Segunda à sexta, das 9h às 18h</li>
                            </ul>
                        </div>

                        <div>
                            <h2 className="text-xl font-bold">Redes sociais</h2>
                            <div className="flex gap-4 text-white text-2xl">
                                <a
                                    href="https://wa.me/5579991190534?text=Ol%C3%A1%2C%20gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20suporte."
                                    target="_blank"
                                    className="bg-green-500 hover:bg-green-600 p-3 rounded-full"
                                >
                                    <FaWhatsapp />
                                </a>
                                <a
                                    href="https://instagram.com/konvertacrm"
                                    target="_blank"
                                    className="bg-pink-500 hover:bg-pink-600 p-3 rounded-full"
                                >
                                    <FaInstagram />
                                </a>
                                <a
                                    href="https://linkedin.com/company/konvertacrm"
                                    target="_blank"
                                    className="bg-blue-700 hover:bg-blue-800 p-3 rounded-full"
                                >
                                    <FaLinkedin />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
