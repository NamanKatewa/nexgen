"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FormWrapper } from "~/components/FormWrapper";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { api } from "~/trpc/react";

import { FieldError } from "~/components/FieldError";
import { type TRateSchema, rateSchema } from "~/schemas/rate";

const RateCalculator = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [rate, setRate] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TRateSchema>({
    resolver: zodResolver(rateSchema),
  });

  const [submittedData, setSubmittedData] = useState<TRateSchema | null>(null);

  const { data, error, isFetching } = api.rate.calculateRate.useQuery(
    submittedData!,
    {
      enabled: !!submittedData,
      retry: false,
    }
  );

  useEffect(() => {
    if (data) {
      setRate(data);
      setSubmittedData(null);
    }
    if (error) {
      setErrorMessage(error.message);
      setSubmittedData(null);
    }
  }, [data, error]);

  const onSubmit = (data: TRateSchema) => {
    setErrorMessage("");
    setRate(null);
    setSubmittedData(data);
  };

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <FormWrapper
        title="Calculate Shipping Rates"
        description="Enter the details to calculate the shipping rate"
        errorMessage={errorMessage}
        cardClassName="w-full max-w-[400px] bg-blue-100/20 p-6 shadow-lg backdrop-blur-md md:p-8"
      >
        <form
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 text-blue-950"
        >
          <div className="space-y-2">
            <Label htmlFor="originZipCode">Origin Pincode</Label>
            <Input
              id="originZipCode"
              type="text"
              placeholder="e.g., 110001"
              {...register("originZipCode")}
              disabled={isFetching}
            />
            <FieldError message={errors.originZipCode?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="destinationZipCode">Destination Pincode</Label>
            <Input
              id="destinationZipCode"
              type="text"
              placeholder="e.g., 400001"
              {...register("destinationZipCode")}
              disabled={isFetching}
            />
            <FieldError message={errors.destinationZipCode?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="packageWeight">Package Weight (in kg)</Label>
            <Input
              id="packageWeight"
              type="number"
              step="0.1"
              placeholder="e.g., 2.5"
              {...register("packageWeight", { valueAsNumber: true })}
              disabled={isFetching}
            />
            <FieldError message={errors.packageWeight?.message} />
          </div>

          <Button type="submit" className="w-full" disabled={isFetching}>
            {isFetching ? "Calculating..." : "Calculate Rate"}
          </Button>
        </form>
        {rate !== null && (
          <div className="mt-4 text-center text-lg font-semibold">
            Calculated Rate: ₹{rate}
          </div>
        )}
      </FormWrapper>
    </div>
  );
};

export default RateCalculator;
