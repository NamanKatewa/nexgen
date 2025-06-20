"use client";

import React, { useRef, useState } from "react";
import { format } from "date-fns";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "~/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";

import { api } from "~/trpc/react";

const entityTypes = [
  "Individual",
  "SelfEmployement",
  "ProprietorshipFirm",
  "LimitedLiabilityParternship",
  "PrivateLimitedCompany",
  "PublicLimitedCompany",
  "PartnershipFirm",
];

type BillingAddress = {
  address_line: string;
  city: string;
  state: string;
  zip_code: string;
};

function isBillingAddress(obj: any): obj is BillingAddress {
  return (
    obj &&
    typeof obj.address_line === "string" &&
    typeof obj.city === "string" &&
    typeof obj.state === "string" &&
    typeof obj.zip_code === "number"
  );
}

const VerifyKycPage = () => {
  const { data: kycList, isLoading } = api.admin.pendingKyc.useQuery(
    undefined,
    {
      retry: 3,
      refetchOnWindowFocus: false,
    }
  );

  const utils = api.useUtils();
  const verifyKyc = api.admin.verifyKyc.useMutation({
    onSuccess: () => utils.admin.pendingKyc.invalidate(),
  });
  const rejectKyc = api.admin.rejectKyc.useMutation({
    onSuccess: () => utils.admin.pendingKyc.invalidate(),
  });

  const topRef = useRef<HTMLDivElement>(null);

  const [filterGST, setFilterGST] = useState("ALL");
  const [filterType, setFilterType] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [selectedKycId, setSelectedKycId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleClearFilters = () => {
    setFilterGST("ALL");
    setFilterType("ALL");
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredList = (kycList ?? []).filter((item) => {
    return (
      (filterGST === "ALL" || (filterGST === "YES" ? item.gst : !item.gst)) &&
      (filterType === "ALL" || item.entity_type === filterType)
    );
  });

  const previewImage = (src: string) => {
    window.open(src, "_blank");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-950">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-screen flex flex-col">
        <div
          ref={topRef}
          className="p-4 border-b flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30"
        >
          <h1 className="text-2xl font-semibold text-blue-950">
            KYC Verification
          </h1>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex gap-2 items-center">
              <label htmlFor="gst-filter" className="text-sm text-blue-950">
                GST:
              </label>
              <Select value={filterGST} onValueChange={setFilterGST}>
                <SelectTrigger
                  id="gst-filter"
                  className="w-[140px] text-blue-950"
                >
                  <SelectValue placeholder="GST: " />
                </SelectTrigger>
                <SelectContent className="text-blue-950">
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="YES">Yes</SelectItem>
                  <SelectItem value="NO">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 items-center">
              <label
                htmlFor="entity-type-filter"
                className="text-sm text-blue-950"
              >
                Entity Type:
              </label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger
                  id="entity-type-filter"
                  className="w-[240px] text-blue-950"
                >
                  <SelectValue placeholder="Entity Type: " />
                </SelectTrigger>
                <SelectContent className="text-blue-950">
                  <SelectItem value="ALL">All Types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="secondary"
              className="text-sm bg-blue-100 hover:bg-blue-200/50"
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="min-w-fit">
            <Table className="table-fixed text-blue-950">
              <TableHeader className="bg-blue-100 z-20 shadow-sm">
                <TableRow>
                  <TableHead className="px-4 w-70 text-blue-950">
                    Entity
                  </TableHead>
                  <TableHead className="px-4 w-50 text-blue-950">
                    Type
                  </TableHead>
                  <TableHead className="px-4 w-50 text-blue-950">
                    Website
                  </TableHead>
                  <TableHead className="px-4 w-70 text-blue-950">
                    Billing Address
                  </TableHead>
                  <TableHead className="px-4 w-50 text-blue-950">
                    Aadhar
                  </TableHead>
                  <TableHead className="px-4 w-50 text-blue-950">PAN</TableHead>
                  <TableHead className="px-4 w-30 text-blue-950">GST</TableHead>
                  <TableHead className="px-4 w-30 text-blue-950">
                    Submitted On
                  </TableHead>
                  <TableHead className="px-4 w-50 text-right text-blue-950">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.map((kyc, i) => {
                  const address = isBillingAddress(kyc.billing_address)
                    ? kyc.billing_address
                    : null;

                  return (
                    <TableRow
                      key={i}
                      className="hover:bg-blue-200 text-sm py-4"
                    >
                      <TableCell className="px-4 whitespace-normal">
                        {kyc.entity_name}
                      </TableCell>
                      <TableCell className="px-4">{kyc.entity_type}</TableCell>
                      <TableCell className="px-4">
                        {kyc.website_url ? (
                          <a
                            href={kyc.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-600 underline whitespace-normal"
                          >
                            {kyc.website_url}
                          </a>
                        ) : (
                          <span className="italic">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4 w-70">
                        {address ? (
                          <div className="text-sm leading-snug whitespace-normal">
                            {address.address_line}
                            <br />
                            {address.city}
                            <br />
                            {address.state}
                            <br />
                            Pincode: {address.zip_code}
                          </div>
                        ) : (
                          <span className="italic">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-3">
                          <span>{kyc.aadhar_number}</span>
                          <div className="flex gap-1">
                            {kyc.aadhar_image_front && (
                              <Image
                                src={kyc.aadhar_image_front}
                                alt="Aadhar Front"
                                width={64}
                                height={64}
                                className="rounded border cursor-pointer"
                                onClick={() =>
                                  previewImage(kyc.aadhar_image_front!)
                                }
                              />
                            )}
                            {kyc.aadhar_image_back && (
                              <Image
                                src={kyc.aadhar_image_back}
                                alt="Aadhar Back"
                                width={64}
                                height={64}
                                className="rounded border cursor-pointer"
                                onClick={() =>
                                  previewImage(kyc.aadhar_image_back!)
                                }
                              />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">
                        <div className="flex flex-col gap-3">
                          <span>{kyc.pan_number}</span>
                          <div className="flex gap-1">
                            {kyc.pan_image_front && (
                              <Image
                                src={kyc.pan_image_front}
                                alt="PAN Front"
                                width={64}
                                height={64}
                                className="rounded border cursor-pointer"
                                onClick={() =>
                                  previewImage(kyc.pan_image_front!)
                                }
                              />
                            )}
                            {kyc.pan_image_back && (
                              <Image
                                src={kyc.pan_image_back}
                                alt="PAN Back"
                                width={64}
                                height={64}
                                className="rounded border cursor-pointer"
                                onClick={() =>
                                  previewImage(kyc.pan_image_back!)
                                }
                              />
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 w-[120px] whitespace-nowrap">
                        <Badge
                          variant={kyc.gst ? "default" : "secondary"}
                          className="text-xs px-3 py-1 min-w-[48px] text-center"
                        >
                          {kyc.gst ? "Yes" : "No"}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4">
                        {kyc.submission_date
                          ? format(new Date(kyc.submission_date), "dd/MM/yyyy")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="px-4 text-right">
                        <Button
                          size="sm"
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => {
                            setSelectedKycId(kyc.kyc_id);
                            setShowModal(true);
                          }}
                        >
                          Accept
                        </Button>{" "}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedKycId(kyc.kyc_id);
                            setRejectReason("");
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {filteredList.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No results found.
              </div>
            )}
          </div>
        </div>
      </div>
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md bg-blue-50 text-blue-950">
          <DialogHeader>
            <DialogTitle>Confirm KYC Approval</DialogTitle>
            <DialogDescription className="text-blue-950">
              Are you sure you want to approve this KYC request?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button
              variant="default"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={async () => {
                if (selectedKycId) {
                  await verifyKyc.mutateAsync({ kycId: selectedKycId });
                  setShowModal(false);
                }
              }}
              disabled={verifyKyc.isPending}
            >
              {verifyKyc.isPending ? "Confirming" : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent className="max-w-md bg-blue-50 text-blue-950">
          <DialogHeader>
            <DialogTitle>Reject KYC</DialogTitle>
            <DialogDescription className="text-blue-950">
              Please provide a reason for rejecting this KYC.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <textarea
              className="w-full h-28 p-2 border border-blue-200 rounded text-sm"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
            />
          </div>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (selectedKycId && rejectReason.trim()) {
                  await rejectKyc.mutateAsync({
                    kycId: selectedKycId,
                    reason: rejectReason,
                  });
                  setShowRejectModal(false);
                }
              }}
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VerifyKycPage;
