"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { CreditCardIcon, CheckIcon } from "lucide-react";

export default function BillingPage() {
  const { business } = useAuth();
  const [connecting, setConnecting] = useState(false);

  const hasStripe = !!business?.id; // Stripe Connect status would come from business record

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="h-5 w-5" />
            Stripe Integration
          </CardTitle>
          <CardDescription>
            Connect your Stripe account to accept payments on invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Status:</span>
            <Badge variant="secondary">
              <CheckIcon className="h-3 w-3 mr-1" />
              Test Mode Active
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Stripe test keys are configured. Payments created through invoice
            payment links will use Stripe&apos;s test environment. No real charges
            will be made.
          </p>
          <div className="rounded-md border p-4 space-y-2">
            <h3 className="font-medium text-sm">How payments work</h3>
            <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1">
              <li>Create an invoice in the Invoice Builder</li>
              <li>Send the invoice to your client</li>
              <li>A Stripe payment link is generated automatically</li>
              <li>When the client pays, the invoice is marked as paid</li>
              <li>A revenue transaction is recorded automatically</li>
            </ol>
          </div>
          <Button
            variant="outline"
            disabled={connecting}
            onClick={() => {
              setConnecting(true);
              // In production, this would redirect to Stripe Connect onboarding
              setTimeout(() => setConnecting(false), 1000);
            }}
          >
            {connecting ? "Connecting..." : "Manage Stripe Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <CardDescription>
            Your current plan and subscription details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Free Plan</p>
              <p className="text-sm text-muted-foreground">
                Full access to all BudgetOS features during beta.
              </p>
            </div>
            <Badge>Active</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
