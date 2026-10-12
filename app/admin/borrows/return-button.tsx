interface ReturnButtonText {
    saving: string;
    markReturned: string;
    failedToReturn: string;
}

export default function ReturnButton({ borrowId, text }: { borrowId: number; text: ReturnButtonText }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);

    async function handleReturn() {
        setLoading(true);
        setError(false);
        try {
            const res = await fetch(`/api/borrows/${borrowId}`, { method: 'PUT' });
            if (!res.ok) throw new Error();
            router.refresh();
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div>
            <Button size="sm" variant="outline" isDisabled={loading} onClick={handleReturn}>
                {loading ? text.saving : text.markReturned}
            </Button>
            {error && <p className="text-sm text-red-600">{text.failedToReturn}</p>}
        </div>
    );
}