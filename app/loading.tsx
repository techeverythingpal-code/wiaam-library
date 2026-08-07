export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="loader" />
            <p className="text-gray-500 text-lg">Loading books...</p>
        </div>
    );
}