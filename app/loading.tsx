export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce">📚</div>
            <p className="text-gray-500 text-lg">Loading books...</p>
        </div>
    );
}