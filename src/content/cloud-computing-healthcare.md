# Cloud Computing in Healthcare

## The Shift to Cloud Infrastructure

The healthcare industry is rapidly migrating from legacy, on premises server rooms to scalable cloud environments (AWS, Azure, Google Cloud). This transition allows hospital networks to leverage elastic computing for massive data workloads, such as genomic sequencing and high resolution medical imaging (PACS), without maintaining expensive local hardware.

## The Business Associate Agreement (BAA)

The fundamental requirement for any healthcare organization moving to the cloud is the **Business Associate Agreement (BAA)**. A cloud provider cannot legally host PHI until a BAA is signed. This legal contract dictates that the cloud provider (the Business Associate) is jointly responsible for safeguarding the PHI according to HIPAA standards alongside the hospital (the Covered Entity).

> **Critical Check:** Before signing any cloud services contract, verify the vendor will execute a BAA. Refusal to sign one is an immediate disqualifier for any service that will touch PHI.

## Data Residency and Encryption

Cloud architecture in healthcare requires strict compliance configurations:

- **Data Residency:** Configurations must guarantee that PHI is stored in data centers located exclusively within the authorized country's borders to comply with national privacy laws.
- **Encryption at Rest:** All S3 buckets, blob storage, and databases must utilize AES-256 encryption.
- **Encryption in Transit:** All API calls and external traffic must be secured via TLS 1.2 or higher.

## Cloud Service Models in Healthcare

| Model | Who Manages What | Healthcare Use Case |
|-------|-----------------|---------------------|
| **IaaS** | Provider: Physical infrastructure. Customer: OS, apps, data. | Hosting PACS imaging servers on AWS EC2 |
| **PaaS** | Provider: Infrastructure + OS. Customer: Applications + data. | Custom EHR application development on Azure |
| **SaaS** | Provider: Everything. Customer: Data only. | Epic hosted cloud, Office 365 for clinical teams |

## Disaster Recovery and High Availability

Cloud migration dramatically improves healthcare disaster recovery capabilities:

- **Geo redundant replication** ensures that a regional outage does not bring down EHR systems.
- **Recovery Time Objective (RTO)** and **Recovery Point Objective (RPO)** targets are more achievable with cloud snapshots vs. tape backup.
- **Auto scaling** prevents downtime during peak clinical hours or mass casualty events.

## References & Citations

- **AWS:** [Architecting for HIPAA Security and Compliance on Amazon Web Services](https://aws.amazon.com/health/healthcare-compliance/hipaa/)  - *Whitepaper on cloud infrastructure compliance and BAA guidance.*
- **Microsoft:** [Azure compliance documentation for HIPAA/HITECH](https://learn.microsoft.com/en-us/azure/compliance/offerings/offering-hipaa-hitech)  - *Guidelines for deploying secure, compliant workloads in Azure.*
