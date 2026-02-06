import { useState, useEffect, useCallback } from "react";
import type { Creator } from "../types";
import { fetchAllAvatars, type AvatarOption } from "../utils/multiAvatarFetcher";
import { buildFallbackAvatar } from "../utils/avatar";

interface BulkAvatarManagerProps {
    creators: Creator[];
    onSave: (updates: { id: string; avatarUrl: string; source: string }[]) => void;
    onClose: () => void;
}

interface CreatorAvatarState {
    creator: Creator;
    options: AvatarOption[];
    selectedUrl: string;
    loading: boolean;
    error: string | null;
}

export default function BulkAvatarManager({ creators, onSave, onClose }: BulkAvatarManagerProps) {
    const [states, setStates] = useState<CreatorAvatarState[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [batchSize] = useState(3); // Process 3 at a time to avoid rate limits
    const [autoSelectBest, setAutoSelectBest] = useState(true);
    const [showOnlyMissing, setShowOnlyMissing] = useState(true);

    // Initialize states from creators
    useEffect(() => {
        const initialStates = creators.map(creator => {
            const hasRealAvatar = creator.avatarUrl && 
                !creator.avatarUrl.includes("dicebear.com") && 
                !creator.avatarUrl.includes("ui-avatars.com");
            
            return {
                creator,
                options: hasRealAvatar ? [{ 
                    url: creator.avatarUrl, 
                    platform: "current", 
                    source: "current", 
                    isValid: true, 
                    isPrimary: true 
                }] : [],
                selectedUrl: creator.avatarUrl || "",
                loading: false,
                error: null
            };
        });
        setStates(initialStates);
    }, [creators]);

    // Get filtered creators based on showOnlyMissing
    const filteredStates = showOnlyMissing 
        ? states.filter(s => !s.selectedUrl || s.selectedUrl.includes("dicebear.com"))
        : states;

    // Fetch avatars for a single creator
    const fetchAvatarsForCreator = useCallback(async (index: number): Promise<void> => {
        setStates(prev => {
            const newStates = [...prev];
            newStates[index] = { ...newStates[index], loading: true, error: null };
            return newStates;
        });

        try {
            const state = states[index];
            const options = await fetchAllAvatars(
                state.creator.accounts,
                state.creator.name,
                state.creator.avatarUrl
            );

            // Filter out invalid/dicebear avatars
            const validOptions = options.filter(opt => 
                opt.isValid && 
                !opt.url.includes("dicebear.com") && 
                !opt.url.includes("ui-avatars.com")
            );

            // Auto-select best option if enabled and no current selection
            let selectedUrl = state.selectedUrl;
            if (autoSelectBest && validOptions.length > 0) {
                const currentValid = state.selectedUrl && 
                    !state.selectedUrl.includes("dicebear.com");
                if (!currentValid) {
                    selectedUrl = validOptions[0].url;
                }
            }

            setStates(prev => {
                const newStates = [...prev];
                newStates[index] = {
                    ...newStates[index],
                    options: validOptions,
                    selectedUrl,
                    loading: false
                };
                return newStates;
            });
        } catch (err) {
            setStates(prev => {
                const newStates = [...prev];
                newStates[index] = {
                    ...newStates[index],
                    loading: false,
                    error: err instanceof Error ? err.message : "Failed to fetch"
                };
                return newStates;
            });
        }
    }, [states, autoSelectBest]);

    // Fetch all avatars in batches
    const fetchAllAvatarsBatch = useCallback(async () => {
        setIsProcessing(true);
        const indicesToFetch = states
            .map((s, i) => ({ state: s, index: i }))
            .filter(({ state }) => 
                !state.selectedUrl || 
                state.selectedUrl.includes("dicebear.com")
            )
            .map(({ index }) => index);

        for (let i = 0; i < indicesToFetch.length; i += batchSize) {
            const batch = indicesToFetch.slice(i, i + batchSize);
            setCurrentIndex(i);
            await Promise.all(batch.map(idx => fetchAvatarsForCreator(idx)));
            // Small delay between batches
            if (i + batchSize < indicesToFetch.length) {
                await new Promise(r => setTimeout(r, 500));
            }
        }
        setIsProcessing(false);
        setCurrentIndex(indicesToFetch.length);
    }, [states, batchSize, fetchAvatarsForCreator]);

    // Handle selecting an avatar for a creator
    const handleSelectAvatar = (creatorIndex: number, url: string) => {
        setStates(prev => {
            const newStates = [...prev];
            newStates[creatorIndex] = { ...newStates[creatorIndex], selectedUrl: url };
            return newStates;
        });
    };

    // Handle saving all changes
    const handleSave = () => {
        const updates = states
            .filter(s => s.selectedUrl && s.selectedUrl !== s.creator.avatarUrl)
            .map(s => ({
                id: s.creator.id,
                avatarUrl: s.selectedUrl,
                source: s.options.find(o => o.url === s.selectedUrl)?.source || "manual"
            }));
        
        onSave(updates);
        onClose();
    };

    // Count stats
    const totalCount = states.length;
    const fetchedCount = states.filter(s => 
        s.options.length > 0 || (s.selectedUrl && !s.selectedUrl.includes("dicebear.com"))
    ).length;
    const missingCount = states.filter(s => 
        !s.selectedUrl || s.selectedUrl.includes("dicebear.com")
    ).length;
    const changedCount = states.filter(s => 
        s.selectedUrl && s.selectedUrl !== s.creator.avatarUrl
    ).length;

    return (
        <div
            className="modal-overlay"
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.85)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 2000,
            }}
        >
            <div
                style={{
                    backgroundColor: "#1a1a2e",
                    borderRadius: "16px",
                    width: "95%",
                    maxWidth: "1200px",
                    maxHeight: "90vh",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    border: "1px solid #333",
                }}
            >
                {/* Header */}
                <div style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #333",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#16162a",
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "22px", color: "#fff" }}>
                            🎨 Bulk Avatar Manager
                        </h2>
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#888" }}>
                            {fetchedCount}/{totalCount} avatars loaded • {missingCount} missing • {changedCount} changed
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#999",
                            fontSize: "28px",
                            cursor: "pointer",
                            padding: "0 8px",
                        }}
                    >
                        ×
                    </button>
                </div>

                {/* Controls */}
                <div style={{
                    padding: "16px 24px",
                    borderBottom: "1px solid #333",
                    display: "flex",
                    gap: "16px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    backgroundColor: "#1e1e32",
                }}>
                    <button
                        onClick={fetchAllAvatarsBatch}
                        disabled={isProcessing}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: isProcessing ? "#444" : "#4CAF50",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                    >
                        {isProcessing ? "⏳" : "🔍"} 
                        {isProcessing ? `Fetching ${currentIndex}...` : "Fetch All Avatars"}
                    </button>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ccc", fontSize: "14px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={autoSelectBest}
                            onChange={(e) => setAutoSelectBest(e.target.checked)}
                            style={{ width: "18px", height: "18px" }}
                        />
                        Auto-select best avatar
                    </label>

                    <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ccc", fontSize: "14px", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={showOnlyMissing}
                            onChange={(e) => setShowOnlyMissing(e.target.checked)}
                            style={{ width: "18px", height: "18px" }}
                        />
                        Show only missing
                    </label>

                    {changedCount > 0 && (
                        <div style={{ marginLeft: "auto", color: "#4CAF50", fontSize: "14px" }}>
                            {changedCount} changes pending
                        </div>
                    )}
                </div>

                {/* Creator Grid */}
                <div style={{
                    flex: 1,
                    overflow: "auto",
                    padding: "20px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "16px",
                }}>
                    {(showOnlyMissing ? filteredStates : states).map((state) => {
                        const originalIndex = states.indexOf(state);
                        const hasRealAvatar = state.selectedUrl && 
                            !state.selectedUrl.includes("dicebear.com") &&
                            !state.selectedUrl.includes("ui-avatars.com");
                        
                        return (
                            <div
                                key={state.creator.id}
                                style={{
                                    backgroundColor: "#252540",
                                    borderRadius: "12px",
                                    padding: "16px",
                                    border: hasRealAvatar ? "2px solid #4CAF50" : "2px solid #444",
                                    opacity: state.loading ? 0.7 : 1,
                                }}
                            >
                                {/* Creator Header */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                    <img
                                        src={state.selectedUrl || buildFallbackAvatar(state.creator)}
                                        alt={state.creator.name}
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "50%",
                                            objectFit: "cover",
                                            border: "2px solid #333",
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ 
                                            fontWeight: "600", 
                                            color: "#fff", 
                                            fontSize: "15px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}>
                                            {state.creator.name}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#888" }}>
                                            {state.creator.accounts.length} accounts
                                        </div>
                                    </div>
                                    {hasRealAvatar && (
                                        <span style={{ color: "#4CAF50", fontSize: "18px" }}>✓</span>
                                    )}
                                </div>

                                {/* Avatar Options */}
                                {state.loading ? (
                                    <div style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                                        <div className="spinner">Loading...</div>
                                    </div>
                                ) : state.options.length > 0 ? (
                                    <div style={{
                                        display: "grid",
                                        gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: "8px",
                                    }}>
                                        {state.options.slice(0, 6).map((option, optIdx) => (
                                            <div
                                                key={optIdx}
                                                onClick={() => handleSelectAvatar(originalIndex, option.url)}
                                                style={{
                                                    cursor: "pointer",
                                                    border: state.selectedUrl === option.url 
                                                        ? "2px solid #4CAF50" 
                                                        : "2px solid transparent",
                                                    borderRadius: "8px",
                                                    overflow: "hidden",
                                                    position: "relative",
                                                    aspectRatio: "1",
                                                }}
                                            >
                                                <img
                                                    src={option.url}
                                                    alt={option.platform}
                                                    style={{
                                                        width: "100%",
                                                        height: "100%",
                                                        objectFit: "cover",
                                                    }}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = "none";
                                                    }}
                                                />
                                                <div style={{
                                                    position: "absolute",
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    backgroundColor: "rgba(0,0,0,0.7)",
                                                    color: "#fff",
                                                    fontSize: "10px",
                                                    padding: "2px 4px",
                                                    textAlign: "center",
                                                    textTransform: "capitalize",
                                                }}>
                                                    {option.platform}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ 
                                        textAlign: "center", 
                                        padding: "20px", 
                                        color: "#666",
                                        fontSize: "13px" 
                                    }}>
                                        {state.error || "No avatars found"}
                                        <button
                                            onClick={() => fetchAvatarsForCreator(originalIndex)}
                                            style={{
                                                display: "block",
                                                margin: "8px auto 0",
                                                padding: "6px 12px",
                                                backgroundColor: "#333",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: "4px",
                                                cursor: "pointer",
                                                fontSize: "12px",
                                            }}
                                        >
                                            🔄 Retry
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div style={{
                    padding: "16px 24px",
                    borderTop: "1px solid #333",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#16162a",
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "10px 20px",
                            backgroundColor: "#444",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={changedCount === 0}
                        style={{
                            padding: "10px 28px",
                            backgroundColor: changedCount === 0 ? "#444" : "#4CAF50",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            cursor: changedCount === 0 ? "not-allowed" : "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                        }}
                    >
                        Save {changedCount > 0 && `(${changedCount})`} Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
