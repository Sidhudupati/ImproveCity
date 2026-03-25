import { useState, useEffect, useRef } from 'react';
import { useFilterStore } from '../stores/uiStore';
import { Button } from '@/components/ui/button';
import { RiGridFill, RiTableLine, RiSearchLine, RiCloseLine, RiMapPin2Line, RiLoader4Line } from 'react-icons/ri';
import type { IssueCategory } from '../types';
import toast from 'react-hot-toast';
import { Input } from './ui/input';

const categories: (IssueCategory | 'All')[] = [
    'All',
    'Pothole',
    'Garbage',
    'Streetlight',
    'Water Supply',
    'Drainage',
    'Road Damage',
    'Parks',
    'Other',
];

// Reverse geocode using OpenStreetMap Nominatim API
async function getHumanReadableLocation(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
        );
        const data = await response.json();
        return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
        console.error("Error fetching address:", error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

// Fetch location suggestions from OpenStreetMap Nominatim API
async function fetchLocationSuggestions(query: string): Promise<any[]> {
    if (!query || query.length < 3) return [];
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`
        );
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching suggestions:", error);
        return [];
    }
}

export function FilterBar() {
    const {
        viewMode,
        setViewMode,
        categoryFilter,
        setCategoryFilter,
        locationFilter,
        setLocationFilter,
        resetFilters
    } = useFilterStore();

    const [locationInput, setLocationInput] = useState(locationFilter.query);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const debounceTimer = useRef<number | null>(null);

    // Cleanup debounce timer on unmount
    useEffect(() => {
        return () => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, []);

    const handleLocationSearch = async () => {
        if (!locationInput.trim()) {
            setLocationFilter({ query: '', latitude: null, longitude: null });
            setSuggestions([]);
            return;
        }

        setIsGeocoding(true);
        try {
            const results = await fetchLocationSuggestions(locationInput);
            if (results.length > 0) {
                const firstResult = results[0];
                setLocationFilter({
                    query: firstResult.display_name,
                    latitude: parseFloat(firstResult.lat),
                    longitude: parseFloat(firstResult.lon),
                });
                setSuggestions([]);
            } else {
                toast.error('Location not found. Please try a different search term.');
            }
        } catch (error) {
            console.error('Geocoding failed:', error);
            toast.error('Failed to search location. Please try again.');
        } finally {
            setIsGeocoding(false);
        }
    };

    const handleClearLocation = () => {
        setLocationInput('');
        setLocationFilter({ query: '', latitude: null, longitude: null });
        setSuggestions([]);
    };

    const handleResetFilters = () => {
        setLocationInput('');
        setSuggestions([]);
        resetFilters();
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setIsGeocoding(true);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const address = await getHumanReadableLocation(lat, lng);

                setLocationInput(address);
                setLocationFilter({
                    query: address,
                    latitude: lat,
                    longitude: lng,
                });
                setSuggestions([]);
                setIsGeocoding(false);
            },
            (error) => {
                console.error("Error getting location:", error);
                toast.error("Could not get your location. Please enter it manually.");
                setIsGeocoding(false);
            }
        );
    };

    // Handle location input with suggestions and debounce
    const handleLocationInput = async (val: string) => {
        setLocationInput(val);

        if (val.length < 3) {
            setSuggestions([]);
            return;
        }

        // Clear existing timer
        if (debounceTimer.current) {
            clearTimeout(debounceTimer.current);
        }

        setIsLoadingSuggestions(true);

        // Set new timer with 500ms delay
        debounceTimer.current = window.setTimeout(async () => {
            try {
                const results = await fetchLocationSuggestions(val);
                setSuggestions(results);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        }, 500);
    };

    const selectSuggestion = (place: any) => {
        const address = place.display_name;
        setLocationInput(address);
        setLocationFilter({
            query: address,
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
        });
        setSuggestions([]);
    };

    const hasActiveFilters = categoryFilter !== 'All' || locationFilter.query !== '';

    return (
        <div className="space-y-2">
            {/* View Mode and Reset */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-muted/30 p-1 rounded-lg">
                    <Button
                        size="sm"
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('grid')}
                        className="gap-2"
                    >
                        <RiGridFill className="w-4 h-4" />
                    </Button>
                    <Button
                        size="sm"
                        variant={viewMode === 'table' ? 'default' : 'ghost'}
                        onClick={() => setViewMode('table')}
                        className="gap-2"
                    >
                        <RiTableLine className="w-4 h-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResetFilters}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <RiCloseLine className="w-4 h-4 mr-1" />
                            Clear all
                        </Button>
                    )}
                </div>

            </div>

            {/* Filters Container */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 space-y-4">
                {/* Category Filter */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Category
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => {
                                    setCategoryFilter(category);
                                }}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${categoryFilter === category
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Location Search */}
                <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Search by Address
                    </label>
                    <div className="relative">
                        <div className="flex gap-2 mb-2">
                            <div className="relative flex-1">
                                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    type="text"
                                    value={locationInput}
                                    onChange={(e) => handleLocationInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch()}
                                    placeholder="Enter address, city, or area..."
                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg"
                                />
                                {locationInput && (
                                    <button
                                        onClick={handleClearLocation}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <RiCloseLine className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <Button
                                onClick={handleLocationSearch}
                                disabled={isGeocoding || !locationInput.trim()}
                                className="gap-2"
                            >
                                {isGeocoding ? (
                                    <>
                                        <RiLoader4Line className="w-4 h-4 animate-spin" />
                                        Searching...
                                    </>
                                ) : (
                                    <>
                                        <RiSearchLine className="w-4 h-4" />
                                        Search
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Location Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
                                {suggestions.map((place, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50 last:border-b-0 text-sm"
                                        onClick={() => selectSuggestion(place)}
                                    >
                                        <div className="flex items-start gap-2">
                                            <RiMapPin2Line className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                                            <span className="line-clamp-2">{place.display_name}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {isLoadingSuggestions && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg p-4 z-50">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                    <RiLoader4Line className="w-4 h-4 animate-spin" />
                                    Searching locations...
                                </div>
                            </div>
                        )}

                        {/* Use Current Location Button */}
                        <button
                            onClick={useCurrentLocation}
                            disabled={isGeocoding}
                            className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RiMapPin2Line className="w-3 h-3" />
                            Use my current location
                        </button>
                    </div>

                    {locationFilter.query && locationFilter.latitude && (
                        <p className="text-xs text-muted-foreground mt-2">
                            📍 Showing issues near: {locationFilter.query}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
