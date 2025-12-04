'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DOMAINS, UserDomain } from '@/config/templates';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface DomainSelectionDialogProps {
    open: boolean;
    onSelect: (domain: UserDomain) => void;
    onCancel: () => void;
}

export function DomainSelectionDialog({ open, onSelect, onCancel }: DomainSelectionDialogProps) {
    const [selectedDomain, setSelectedDomain] = useState<UserDomain | null>(null);

    const handleConfirm = () => {
        if (selectedDomain) {
            onSelect(selectedDomain);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="sm:max-w-[600px] bg-background">
                <DialogHeader>
                    <DialogTitle className="text-2xl text-center">Choose Your Workspace</DialogTitle>
                    <DialogDescription className="text-center text-muted-foreground">
                        Select a domain to get tailored templates and features. You can change this later in settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {DOMAINS.map((domain) => {
                        const Icon = domain.icon;
                        const isSelected = selectedDomain === domain.id;

                        return (
                            <Card
                                key={domain.id}
                                className={cn(
                                    "relative p-4 cursor-pointer transition-all border-2 hover:border-primary/50",
                                    isSelected ? "border-primary bg-primary/5" : "border-border"
                                )}
                                onClick={() => setSelectedDomain(domain.id)}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "p-3 rounded-lg",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        <Icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-foreground">{domain.label}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>
                                    </div>
                                    {isSelected && (
                                        <CheckCircle className="h-6 w-6 text-primary absolute top-4 right-4" />
                                    )}
                                </div>
                            </Card>
                        );
                    })}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between gap-4">
                    <Button variant="ghost" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={!selectedDomain}
                        className="w-full sm:w-auto min-w-[120px]"
                    >
                        Get Started
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
