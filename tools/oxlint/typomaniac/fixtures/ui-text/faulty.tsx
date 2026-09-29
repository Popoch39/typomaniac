const Tooltip = ({ title }: { title: string }) => <span>{title}</span>;

export const Faulty = ({ ranked, count }: { ranked: boolean; count: number }) => (
  <section aria-label="Barre latérale">
    <h1>Classement</h1>
    <p>{"Pas encore de Duel"}</p>
    <p>{ranked ? "Duel classé" : "Challenge"}</p>
    <p>{count === 0 && `Aucun ${count} Friend`}</p>
    <button type="button" title="Couper le son">
      ×
    </button>
    <img src="/crest.svg" alt={"Blason"} />
    <input placeholder="Chercher un User" />
    <progress value={count} max={100} aria-valuetext={`${count} TP sur 100`} />
    <Tooltip title="Suivant" />
    <p>{count} s</p>
    <p>3 GitHub Stars</p>
  </section>
);
