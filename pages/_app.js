import "@/styles/globals.css";
import Head from "next/head";
import Simulator from "components/Simulator";

export default function App() {
  return (
    <div className="bg-yellow-50 h-screen overflow-auto">
      <Head>
        <title>Algorithm Simulator</title>
      </Head>
      <Simulator />
    </div>
  );
}
