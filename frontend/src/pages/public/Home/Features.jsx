import {
  FaBookOpen,
  FaCalendarCheck,
  FaQrcode,
  FaChartLine,
} from "react-icons/fa";

import Card from "../../../components/ui/Card";
import Container from "../../../components/ui/Container";
import SectionHeading from "../../../components/ui/SectionHeading";

const features = [
  {
    icon: FaBookOpen,
    title: "Smart Book Management",
    description:
      "Search, explore, and discover books with a modern and intuitive catalog.",
  },
  {
    icon: FaCalendarCheck,
    title: "Online Reservations",
    description:
      "Reserve books online and receive notifications when they're ready.",
  },
  {
    icon: FaQrcode,
    title: "QR Library Card",
    description:
      "Use a digital QR-based library card for quick borrowing and returns.",
  },
  {
    icon: FaChartLine,
    title: "Analytics & Reports",
    description:
      "Track borrowing trends and generate insightful library reports.",
  },
];

function Features() {
  return (
    <section className="bg-slate-50 py-20">
      <Container>
        <SectionHeading
          title="Why Choose LibConnect?"
          subtitle="Modern features designed for readers, librarians, and administrators."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title}>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                  <Icon className="text-2xl text-blue-600" />
                </div>

                <h3 className="mb-3 text-xl font-semibold text-slate-900">
                  {feature.title}
                </h3>

                <p className="text-slate-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default Features;