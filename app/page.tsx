import QuizApp from "@/components/QuizApp";

export default function Home() {
  return (
    <main className="min-h-screen flex items-start justify-center px-4 py-8 bg-[#F8F7F4]">
      <div className="w-full max-w-[680px] bg-white border border-[#E8E4DD] rounded-2xl p-6 sm:p-10 shadow-none">
        <QuizApp />
      </div>
    </main>
  );
}
