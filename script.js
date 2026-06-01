const revealElements = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  revealElements.forEach((element) => observer.observe(element));
} else {
  revealElements.forEach((element) => element.classList.add("visible"));
}

const printButtons = document.querySelectorAll(".js-print");
printButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    window.print();
  });
});

const agreementModal = document.querySelector(".agreement-modal");
const openAgreementButtons = document.querySelectorAll(".js-open-agreement");
const closeAgreementButtons = document.querySelectorAll(".js-close-agreement");

function openAgreementModal() {
  if (!agreementModal) return;
  agreementModal.classList.add("is-open");
  agreementModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeAgreementModal() {
  if (!agreementModal) return;
  agreementModal.classList.remove("is-open");
  agreementModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

openAgreementButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openAgreementModal();
  });
});

closeAgreementButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    closeAgreementModal();
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAgreementModal();
  }
});
