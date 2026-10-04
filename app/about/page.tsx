import { InfoPage } from "@/components/site/InfoPage";

export default function AboutPage() { return (
    <InfoPage title="À propos">
      <p>LOC MAISON est née à Mahdia pour aider les familles, les couples et les Tunisiens de l'étranger à trouver une maison d'été fiable sur la côte.</p>
      <p>Nous accompagnons aussi les étudiants de Mahdia pour leur logement de l'année universitaire.</p>
      
      <div className="mt-12 space-y-1">
        <p className="font-medium text-foreground">Développé par <a href="https://microedition.tn/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">Micro Edition</a></p>
        <p className="text-muted-foreground">Founder &amp; Project Lead &mdash; Akrem Barboura</p>
      </div>
    </InfoPage>
  );
}
