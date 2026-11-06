import type { Metadata } from "next";
import { AddressForm } from "@/components/account/AccountForms";
import { SubmitButton } from "@/components/ui/Form";
import { countryName } from "@/config/countries";
import { requireUser } from "@/lib/auth";
import { userAddresses } from "@/lib/addresses";
import { readSettings } from "@/lib/catalog-store";
import { deleteAddress } from "../../actions";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const list = userAddresses(user.id);
  return (
    <div className="space-y-[30px]">
      <section>
        <h2 className="text-[18px] font-bold text-ink">Saved addresses</h2>
        {list.length === 0 && <p className="mt-[8px] text-[15px]">No addresses yet.</p>}
        <ul className="mt-[12px] grid gap-[14px] sm:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="border border-line p-[16px] text-[15px] leading-[22px] text-ink">
              <p className="font-bold">{a.full_name}</p>
              <p>{a.line1}</p>
              {a.line2 && <p>{a.line2}</p>}
              <p>
                {a.postcode} {a.city}
              </p>
              <p>{countryName(a.country)}</p>
              {a.phone && <p className="text-[#888]">{a.phone}</p>}
              <form action={deleteAddress.bind(null, a.id)} className="mt-[10px]">
                <SubmitButton variant="plain" className="h-[34px]">
                  Delete
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      </section>
      <section className="max-w-[640px]">
        <h2 className="text-[18px] font-bold text-ink">Add an address</h2>
        <p className="mt-[4px] text-[14px]">We currently deliver to the UK only.</p>
        <div className="mt-[12px]">
          <AddressForm countries={readSettings().delivery.countries} />
        </div>
      </section>
    </div>
  );
}
