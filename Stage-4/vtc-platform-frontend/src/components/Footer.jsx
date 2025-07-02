import { Separator } from "@/components/ui/separator";
import { Instagram, Send } from "lucide-react";

function XIcon(props) {
  return (
    <svg
      {...props}
      viewBox="0 0 16 16"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full bg-white text-black">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center md:justify-between gap-6">

        {/* --- Logo + copyright --- */}
        <div className="flex flex-col items-center md:items-start gap-2">
          <img
            src="https://i.ibb.co/4RDdKn8S/logo.png"  /* ton logo “pas trop grand” */
            alt="French Driver"
            className="h-8 w-auto"
          />
          <p className="text-sm">&copy; {new Date().getFullYear()} French Driver</p>
        </div>

        {/* --- Réseaux sociaux --- */}
        <div className="flex gap-6">
          <a
            href="https://x.com/"        
            aria-label="French Driver sur X"
            className="hover:text-white transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </a>
          <a
            href="https://instagram.com/" 
            aria-label="French Driver sur Instagram"
            className="hover:text-white transition-colors"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="https://t.me/"          
            aria-label="French Driver sur Telegram"
            className="hover:text-white transition-colors"
          >
            <Send className="h-5 w-5" />
          </a>
        </div>
      </div>

    </footer>
  );
}
