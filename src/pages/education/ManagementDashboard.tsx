export default function ManagementDashboard() {
  return (
    <div>
      <h2 className="text-2xl font-heading text-foreground mb-6">Onderwijsmanagement</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {["Overzicht", "Klassen", "Rapportages"].map((item) => (
          <div key={item} className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold text-foreground">{item}</h3>
            <p className="text-muted-foreground text-sm mt-1">Bekijk {item.toLowerCase()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}