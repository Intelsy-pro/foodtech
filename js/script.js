document.addEventListener('DOMContentLoaded', function () {
    // ── GSAP Parallax Badge ──
    var badge = document.getElementById('parallaxBadge');
    if (badge && typeof gsap !== 'undefined') {
        var SHIFT_X = -40;
        var SHIFT_Y = -40;
        var DURATION = 0.5;
        window.addEventListener('mousemove', function (e) {
            gsap.to(badge, {
                x: e.clientX / SHIFT_X,
                y: e.clientY / SHIFT_Y,
                duration: DURATION
            });
        });
    }

    // ── GSAP Parallax Image ──
    var parallaxImg = document.getElementById('parallaxImage');
    if (parallaxImg && typeof gsap !== 'undefined') {
        var IMG_SHIFT_X = -5;
        var IMG_SHIFT_Y = -10;
        var IMG_DURATION = 0.5;
        window.addEventListener('mousemove', function (e) {
            gsap.to(parallaxImg, {
                x: e.clientX / IMG_SHIFT_X,
                y: e.clientY / IMG_SHIFT_Y,
                duration: IMG_DURATION
            });
        });
    }

    // ── Scroll reveal (IntersectionObserver) ──
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        reveals.forEach(function (element) { observer.observe(element); });
    } else {
        reveals.forEach(function (element) { element.classList.add('is-visible'); });
    }

    // ── Form submission ──
    const form = document.getElementById('contact-form');

    if (form) {
        const PHONE_MASK = '+7 (###) ###-##-##';
        const ERRORS = {
            required: 'Поле обязательное',
            email: 'Некорректный e-mail',
            phone: 'Некорректный телефон',
            fileFormat: 'Неподдерживаемый тип файла',
            fileSize: (limit) => `Файл не должен превышать ${limit}.`,
        };
        const MAX_FILE_SIZE = 20;

        const state = {
            files: [],
            shouldShowErrors: false,
            filesError: false,
            isLoading: false,
            isSent: false,
            isPopoverOpen: false,
        };

        const elements = {
            // Поля ввода
            name: document.getElementById('name-input'),
            description: document.getElementById('description-input'),
            phone: document.getElementById('phone-input'),
            email: document.getElementById('email-input'),
            agreement: document.getElementById('agreement-input'),
            files: document.getElementById('files-input'),
            // Обёртки полей
            nameField: document.getElementById('name-field'),
            descriptionField: document.getElementById('description-field'),
            phoneField: document.getElementById('phone-field'),
            emailField: document.getElementById('email-field'),
            agreementField: document.getElementById('agreement-field'),
            filesField: document.getElementById('files-field'),
            // Ошибки
            nameError: document.getElementById('name-error'),
            descriptionError: document.getElementById('description-error'),
            phoneError: document.getElementById('phone-error'),
            emailError: document.getElementById('email-error'),
            filesError: document.getElementById('files-error'),
            // Работа с файлоами
            filesPopover: document.getElementById('files-popover'),
            filesTags: document.getElementById('files-tags'),
            // Форма
            submitButton: document.getElementById('submit-button'),
            sendAnotherButton: document.getElementById('send-another-button'),
            formSuccess: document.getElementById('form-success'),
            formFields: document.getElementById('form-fields'),
        }

        function checkIsValidEmail(email) {
            return /^(.+)@(.+)\.(.+)$/.test(email);
        }

        function checkIsValidPhone(phone) {
            return phone.length === PHONE_MASK.length;
        }

        function checkIsCorrectFileSize(file) {
            return file.size / 1024 ** 2 <= MAX_FILE_SIZE;
        }

        function checkIsCorrectFileFormat(file) {
            return /^.*\.(pdf|doc|docx|txt|xls|png|jpg|jpeg)$/i.test(file.name);
        }

        function fileToDataUri(file) {
            return new Promise((resolve, reject) => {
                if (!checkIsCorrectFileSize(file)) {
                    reject(ERRORS.fileSize(`${MAX_FILE_SIZE}Мб`));
                    return;
                }
                if (!checkIsCorrectFileFormat(file)) {
                    reject(ERRORS.fileFormat);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (event) => resolve(event.target?.result?.toString() ?? '');
                reader.onerror = () => reject('Ошибка чтения файла');
                reader.readAsDataURL(file);
            });
        }

        /** Валидация полей */
        function validateFields() {
            const name = elements.name.value.trim();
            const description = elements.description.value.trim();
            const phone = elements.phone.value;
            const email = elements.email.value.trim();
            const agreement = elements.agreement.checked;

            const isValidEmail = checkIsValidEmail(email);
            const isValidPhone = checkIsValidPhone(phone);

            const nameError = !name ? ERRORS.required : false;
            const descriptionError = !description ? ERRORS.required : false;
            const phoneError = !isValidEmail && !isValidPhone ? ERRORS.phone : false;
            const emailError = !isValidPhone && !isValidEmail ? ERRORS.email : false;
            const agreementError = !agreement;

            const hasError = Boolean(nameError || descriptionError || phoneError || emailError || agreementError);

            return { nameError, descriptionError, phoneError, emailError, agreementError, hasError };
        }

        /** Установка ошибки в поле ввода */
        function setFieldError(fieldElement, errorElement, error, shouldShow) {
            const hasError = shouldShow && error;
            fieldElement.classList.toggle('is-error', hasError);
            if (hasError) {
                errorElement.textContent = error;
                errorElement.hidden = false;
            } else {
                errorElement.hidden = true;
                errorElement.textContent = '';
            }
        }

        /** Обновление UI после валидации */
        function updateValidationUI() {
            const validations = validateFields();

            setFieldError(elements.nameField, elements.nameError, validations.nameError, state.shouldShowErrors);
            setFieldError(elements.descriptionField, elements.descriptionError, validations.descriptionError, state.shouldShowErrors);
            setFieldError(elements.phoneField, elements.phoneError, validations.phoneError, state.shouldShowErrors);
            setFieldError(elements.emailField, elements.emailError, validations.emailError, state.shouldShowErrors);

            elements.agreementField.classList.toggle('is-error', state.shouldShowErrors && validations.agreementError);
            elements.agreementField.classList.toggle('is-checked', elements.agreement.checked);

            elements.filesField.classList.toggle('is-error', state.filesError);
            if (state.filesError) {
                elements.filesError.textContent = state.filesError;
                elements.filesError.hidden = false;
            } else {
                elements.filesError.hidden = true;
                elements.filesError.textContent = '';
            }

            elements.phone.required = !elements.email.value.length;
            elements.email.required = !elements.phone.value.length;
        }

        /** Обновление UI после успеха */
        function updateSuccessUI() {
            elements.formSuccess.hidden = !state.isSent;
            elements.formFields.classList.toggle('is-hidden', state.isSent);
        }

        /** Авторесайз текстового поля */
        function autoResizeTextarea(textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }

        /** Применение маски телефона */
        function phoneMaskInput(value) {
            let result = value.replace(/\D/g, '');
            if (!result) return '';

            if (['7', '8'].includes(result[0])) result = result.slice(1);

            let mask = PHONE_MASK;
            result.split('').forEach((element) => {
                mask = mask.replace('#', element);
            });
            mask = mask.replace(/[^\d]*$/, '');

            return mask.trim();
        }

        function createFileTag(fileItem, index) {
            const tag = document.createElement('div');
            tag.className = 'file-tag';

            const name = document.createElement('span');
            name.className = 'file-tag__name';
            name.textContent = fileItem.file.name;
            tag.appendChild(name);

            if (!fileItem.url) {
                const spinner = document.createElement('span');
                spinner.className = 'file-tag__spinner';
                spinner.setAttribute('aria-label', 'Загрузка');
                tag.appendChild(spinner);
            } else {
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'file-tag__remove';
                removeButton.setAttribute('aria-label', 'Удалить файл');
                removeButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M5 5l6 6M11 5l-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
                removeButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    removeFile(index);
                });
                tag.appendChild(removeButton);
            }

            return tag;
        }

        function removeFile(index) {
            state.files = state.files.filter((_, fileIndex) => fileIndex !== index);
            renderFilesTags();
        }

        /** Рендер добавленных файлов */
        function renderFilesTags() {
            elements.filesTags.innerHTML = '';
            elements.filesPopover.innerHTML = '';

            if (state.files.length === 0) {
                elements.filesPopover.hidden = true;
                return;
            }

            const first = state.files[0];
            elements.filesTags.appendChild(createFileTag(first, 0));

            if (state.files.length > 1) {
                const moreButton = document.createElement('button');
                moreButton.type = 'button';
                moreButton.className = 'file-tag file-tag--more typography-body-s';
                moreButton.textContent = `+${state.files.length - 1}`;
                moreButton.addEventListener('click', (event) => {
                    event.stopPropagation();
                    state.isPopoverOpen = !state.isPopoverOpen;
                    elements.filesPopover.hidden = !state.isPopoverOpen;
                });
                elements.filesTags.appendChild(moreButton);

                state.files.slice(1).forEach((file, index) => {
                    elements.filesPopover.appendChild(createFileTag(file, index + 1));
                });
                elements.filesPopover.hidden = !state.isPopoverOpen;
            } else {
                elements.filesPopover.hidden = true;
                state.isPopoverOpen = false;
            }
        }

        /** Добавление файлов */
        function addFiles(fileList) {
            const newFiles = Array.from(fileList).map((file) => ({ file, url: null }));
            state.filesError = false;
            state.files = [...state.files, ...newFiles];
            renderFilesTags();
            updateValidationUI();

            newFiles.forEach((fileItem) => {
                const index = state.files.findIndex((f) => f.file === fileItem.file);
                fileToDataUri(fileItem.file)
                    .then((url) => {
                        if (index !== -1) {
                            state.files[index].url = url;
                            renderFilesTags();
                        }
                    })
                    .catch((error) => {
                        state.filesError = error;
                        state.files = state.files.filter((f) => f.file !== fileItem.file);
                        renderFilesTags();
                        updateValidationUI();
                    });
            });
        }

        /** Обработка ввода имени */
        elements.name.addEventListener('input', () => {
            autoResizeTextarea(elements.name);
            updateValidationUI();
        });

        /** Обработка ввода описания проекта */
        elements.description.addEventListener(('input'), () => {
            autoResizeTextarea(elements.description);
            updateValidationUI();
        });

        /** Обработка ввода телефона */
        elements.phone.addEventListener('input', (event) => {
            const masked = phoneMaskInput(event.target.value);
            if (masked || !event.target.value) {
                elements.phone.value = masked;
            }
            updateValidationUI();
        });

        /** Обработка ввода электронной почты */
        elements.email.addEventListener('input', updateValidationUI);

        /** Обработка изменения согласия */
        elements.agreement.addEventListener('change', updateValidationUI);

        /** Обработка добавления файлов */
        elements.files.addEventListener('change', (event) => {
            if (!event.target.files?.length) return;

            addFiles(event.target.files);
            elements.files.value = '';
        });

        /** Создание FormData */
        function transformToFormData(data) {
            const formData = new FormData();

            Object.entries(data).forEach((entry) => {
                formData.append(...entry);
            });

            return formData;
        };

        function resetForm() {
            elements.name.value = '';
            elements.description.value = '';
            elements.phone.value = '';
            elements.email.value = '';
            elements.agreement.checked = false;
            elements.files.value = '';
            state.files = [];
            state.shouldShowErrors = false;
            state.filesError = false;
            state.isPopoverOpen = false;
            renderFilesTags();
            autoResizeTextarea(elements.name);
            autoResizeTextarea(elements.description);
            updateValidationUI();
        }

        elements.sendAnotherButton.addEventListener('click', () => {
            state.isSent = false;
            updateSuccessUI();
        });

        /** Обработка отправки формы */
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            state.shouldShowErrors = true;
            updateValidationUI();

            const { hasError } = validateFields();
            if (hasError || state.filesError) return;

            const payload = {
                name: elements.name.value.trim(),
                description: elements.description.value.trim(),
                phone: elements.phone.value,
                email: elements.email.value.trim(),
            };

            const formData = transformToFormData(payload);

            state.files.forEach((file) => {
                formData.append('files', file.file);
            });

            state.isLoading = true;
            elements.submitButton.disabled = true;

            fetch('https://intelsy.ru/api/application/', {
                method: 'POST',
                body: formData
            }).then(() => {
                resetForm();
                state.isLoading = false;
                state.isSent = true;
                elements.submitButton.disabled = false;
                updateSuccessUI();
            });
        });
    }

    updateValidationUI();
});
