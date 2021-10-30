const content = document.getElementById("content");
const addBtn = document.getElementById("addBtn");
const searchBtn = document.getElementById("searchBtn");
const TABLE_HEAD =
    `
    <thead><tr>
        <th>ID</th><th>First Name</th><th>Last Name</th><th>Age</th><th>Gender</th><th>Degree</th><th>Photo</th>
    </tr></thead>
`;

const showAdd = async () => {
    let options = {
        method: 'GET'
    }
    let response = await fetch('/add', options);
    if (!response.ok) throw new Error(`Error POSTing ${response.status} ${response.statusText}`)
    else if (response.ok) {
        response.text().then(html => {
            content.innerHTML = html;
        }).then(() => {
            document.querySelector('#photo-input input[type=file]').addEventListener('change', updateFileInput);
            document.getElementById("closeModal").addEventListener('click', closeModal);
            addBtn.classList.add("is-active");
            searchBtn.classList.remove("is-active");
        })
    }
}

const showSearch = async () => {
    let options = {
        method: 'GET'
    }
    let response = await fetch('/search', options);
    if (!response.ok) throw new Error(`Error POSTing ${response.status} ${response.statusText}`);
    else if (response.ok) {
        response.text().then(html => {
            content.innerHTML = html;
        }).then( ()=> {
            document.getElementById("closeModal").addEventListener('click', closeModal);
            searchBtn.classList.add("is-active");
            addBtn.classList.remove("is-active");
        })
    }
}

const updateFileInput = () => {
    if (fileInput.files.length > 0) {
        const fileName = document.querySelector('#photo-input .file-name');
        fileName.textContent = fileInput.files[0].name;
    }
}

const search = async (e) => {
    e.preventDefault();
    let formid = e.target.id;
    let form = document.getElementById(formid);
    let formData = new FormData(form);

    let data = Object.fromEntries(formData.entries());

    if (data.keyword == null || data.keyword.length == 0) {

        return false
    }

    let options = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            keyword: data.keyword,
        })
    }
    let response = await fetch('/data', options)
    if (!response.ok) throw new Error(`Error POSTing ${response.status} ${response.statusText}`);
    else if (response.ok) {
        response.json().then(data => {
            result = document.getElementById("resultTable");
            let tbody = "<tbody>";
            data.forEach(row => {
                let tr =
                    `
                <tr>
                <td>${row.id}</td>
                <td>${row.fname}</td>
                <td>${row.lname}</td>
                <td>${row.age}</td>
                <td>${row.gender}</td>
                <td>${row.degree}</td>
                `;
                if (row.photo) tr += `<td><button class="button" onclick="showImage('${row.photo}')">view</button></td>`;
                else tr += `<td>-</td>`;
                tr += `</tr>`;

                tbody += tr;
            });
            tbody += "</tbody>";
            let tablehtml = TABLE_HEAD + tbody
            result.innerHTML = tablehtml;
        })
    }
}

const upload = async (e) => {
    e.preventDefault();
    let formid = e.target.id
    let form = document.getElementById(formid);
    let formData = new FormData(form);

    let data = Object.fromEntries(formData.entries());

    if (data.sid == null || data.sid.length == 0) {
        return false
    } else if (data.fname == null || data.fname.length == 0) {
        return false
    } else if (data.lname == null || data.lname.length == 0) {
        return false
    } else if (data.age == null || data.age.length == 0) {
        return false
    } else if (data.gender == null || data.gender.length == 0) {
        return false
    } else if (data.degree == null || data.degree.length == 0) {
        return false
    }

    let options = {
        method: 'POST',
        body: formData
    }
    fetch('/upload', options).then(res => {
        if (res.status == 200) {
            form.reset();
        }

        res.text().then(message => {
            showAlert(message);
        })
    });
}

const showModal = () => {
    modal = document.getElementById("myModal");
    modal.classList.add("is-active");
}

const closeModal = () => {
    modal = document.getElementById("myModal");
    modal.classList.remove("is-active")
}

const showImage = (value) => {
    img = document.getElementById("myImg");
    img.src = ('/photo?photo=' + value);
    showModal();
}

const showAlert = (message) => {
    msg = document.getElementById("message");
    msg.textContent = message;
    showModal();
}

